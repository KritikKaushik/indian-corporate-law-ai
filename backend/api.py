from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback
from werkzeug.utils import secure_filename
import pdfplumber
from datetime import datetime

app = Flask(__name__)
CORS(app) 

UPLOAD_FOLDER      = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}
MAX_FILE_SIZE      = 50 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER']      = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

DATA_PATH      = "output/companies_act_dataset.json"
EMBEDDING_PATH = "output/embeddings.npy"
METADATA_PATH  = "output/metadata.pkl"
FAISS_PATH     = "output/faiss_index.bin"


# ── Lazy imports ──────────────────────────────────────────────────────────────
def _core():
    import main as m
    return m


def _pipeline():
    import pdf_extract as pe
    import extract_section_titles as est
    import build_section_dataset as bsd
    return pe, est, bsd


# ── Helpers ───────────────────────────────────────────────────────────────────
def allowed_file(fn):
    return '.' in fn and fn.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text(filepath, ext):
    if ext == 'pdf':
        text = ""
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        return text
    if ext == 'txt':
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    if ext == 'docx':
        from docx import Document
        return "\n".join(p.text for p in Document(filepath).paragraphs)
    raise ValueError(f"Unsupported: {ext}")


def build_search_query(text: str) -> str:
    m = _core()
    body = text[150:3000]
    body = re.sub(r'^\s*\d+[A-Z]?\.\s*', '', body, flags=re.MULTILINE)

    keywords = m.extract_keywords(body, max_words=15)
    return keywords


import re  

def summarize_sections(results):
    if not results:
        return "No related sections found."
    lines = [f"Found {len(results)} related Companies Act section(s):\n"]
    for i, s in enumerate(results, 1):
        lines.append(f"{i}. Section {s['section_number']}: {s['section_title']}")
    return "\n".join(lines)


def system_status():
    return {
        "act_pdf":     os.path.exists("act.pdf"),
        "raw_text":    os.path.exists("output/raw_text.txt"),
        "titles_json": os.path.exists("output/section_titles.json"),
        "dataset":     os.path.exists(DATA_PATH),
        "embeddings":  os.path.exists(EMBEDDING_PATH),
        "metadata":    os.path.exists(METADATA_PATH),
        "faiss_index": os.path.exists(FAISS_PATH),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    st = system_status()
    return jsonify({'status': 'ok', 'pipeline_ready': all(st.values()), 'details': st})


@app.route('/api/status', methods=['GET'])
def status():
    st = system_status()
    ollama_ok, model_name = False, None
    try:
        m = _core()
        model_name = m.get_model_name()
        ollama_ok = True
    except Exception:
        pass
    return jsonify({
        'pipeline': st,
        'pipeline_ready': all(st.values()),
        'ollama_ok': ollama_ok,
        'model': model_name,
    })


@app.route('/api/setup', methods=['POST'])
def setup():
    try:
        pe, est, bsd = _pipeline()
        m = _core()

        if not os.path.exists("act.pdf"):
            return jsonify({
                'status': 'error',
                'error': 'act.pdf not found. Place the full Companies Act 2013 PDF in the backend folder.'
            }), 400

        os.makedirs("output", exist_ok=True)
        steps = []

        if not os.path.exists("output/raw_text.txt"):
            pe.extract_pdf(); steps.append("✅ PDF extracted")
        else:
            steps.append("⏭️ PDF already extracted")

        if not os.path.exists("output/section_titles.json"):
            est.extract_titles(); steps.append("✅ Section titles extracted")
        else:
            steps.append("⏭️ Titles already exist")

        if not os.path.exists(DATA_PATH):
            bsd.build_dataset(); steps.append("✅ Dataset built")
        else:
            steps.append("⏭️ Dataset already exists")

        if not os.path.exists(EMBEDDING_PATH):
            m.create_embeddings(); steps.append("✅ Embeddings created")
        else:
            steps.append("⏭️ Embeddings already exist")

        if not os.path.exists(FAISS_PATH):
            m.build_faiss(); steps.append("✅ FAISS index built")
        else:
            steps.append("⏭️ FAISS index already exists")

        m.invalidate_index_cache()
        m._load_index()

        return jsonify({'status': 'success', 'message': '✅ Setup complete!', 'steps': steps})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file in request'}), 400
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': f'Unsupported type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        ext = filename.rsplit('.', 1)[1].lower()

        try:
            extracted_text = extract_text(filepath, ext)
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

        if not extracted_text or not extracted_text.strip():
            return jsonify({'error': 'No text could be extracted from the file'}), 400

        print(f"\n📄 {filename} — {len(extracted_text)} chars")

        m = _core()

        # Build smart search query
        search_query = build_search_query(extracted_text)
        print(f"🔑 Search keywords: {search_query}")

        search_results, search_error = [], None
        try:
            search_results = m.search(search_query, top_k=3)
            print(f"✅ {len(search_results)} unique sections matched: "
                  f"{[r['section_number'] for r in search_results]}")
        except Exception as e:
            search_error = str(e)
            print(f"⚠️  Search failed: {e}")

        ai_analysis, ai_error = "", None
        try:
            ai_analysis = m.generate_answer(
                search_query, search_results,
                file_excerpt=extracted_text[:400]
            )
        except Exception as e:
            ai_error = str(e)
            ai_analysis = (
                f"⚠️ AI unavailable.\nReason: {ai_error}\n\n"
                "Fix: make sure Ollama is running → ollama pull mistral"
            )
            print(f"⚠️  AI failed: {e}")

        warnings = {k: v for k, v in [('search', search_error), ('ai', ai_error)] if v}

        return jsonify({
            'status': 'success',
            'file': {
                'name': filename,
                'size': len(extracted_text.encode('utf-8')),
                'type': ext,
                'uploadedAt': datetime.now().isoformat()
            },
            'extracted_text':    extracted_text[:1500],
            'text_length':       len(extracted_text),
            'search_query_used': search_query,
            'related_sections':  search_results,
            'sections_summary':  summarize_sections(search_results),
            'ai_analysis':       ai_analysis,
            'sections_count':    len(search_results),
            'warnings':          warnings,
            'message': f'✅ Processed! Found {len(search_results)} related section(s).'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/api/query', methods=['POST'])
def query_dataset():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'No query provided'}), 400

        query  = data['query']
        top_k  = data.get('top_k', 3)
        m      = _core()
        results = m.search(query, top_k=top_k)

        ai_analysis = ""
        try:
            ai_analysis = m.generate_answer(query, results)
        except Exception as e:
            ai_analysis = f"⚠️ AI unavailable: {e}"

        return jsonify({
            'status': 'success',
            'query': query,
            'results': results,
            'sections_count': len(results),
            'sections_summary': summarize_sections(results),
            'ai_analysis': ai_analysis,
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


# ── Startup ───────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "=" * 55)
    print("AI Legal Assistant API")
    print("=" * 55)
    st = system_status()
    for k, v in st.items():
        print(f"  {'Yeah' if v else 'Nope'} {k}")

    if not all(st.values()):
        print("\n Pipeline incomplete")
    else:
        print("\n All data ready !!!")
    print("\n http://localhost:5000")
    print("=" * 55 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
