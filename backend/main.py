"""
main.py — core logic (search + LLM).
FAISS index and metadata loaded ONCE into RAM at import/startup.
"""

import json
import re
import numpy as np
import faiss
import pickle
from sentence_transformers import SentenceTransformer
import ollama

# ── Paths ─────────────────────────────────────────────────────────────────────
DATA_PATH      = "output/companies_act_dataset.json"
EMBEDDING_PATH = "output/embeddings.npy"
METADATA_PATH  = "output/metadata.pkl"
FAISS_PATH     = "output/faiss_index.bin"

# ── Load embedding model once ─────────────────────────────────────────────────
print("⏳ Loading sentence-transformer model...")
_embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Embedding model loaded")

# ── In-memory FAISS cache ─────────────────────────────────────────────────────
_faiss_index = None
_metadata    = None


def _load_index():
    global _faiss_index, _metadata
    if _faiss_index is not None:
        return True
    import os
    if not (os.path.exists(FAISS_PATH) and os.path.exists(METADATA_PATH)):
        return False
    try:
        print("📦 Loading FAISS index into RAM...")
        _faiss_index = faiss.read_index(FAISS_PATH)
        with open(METADATA_PATH, "rb") as f:
            _metadata = pickle.load(f)
        print(f"✅ Index ready — {len(_metadata)} sections in memory")
        return True
    except Exception as e:
        print(f"❌ Index load error: {e}")
        return False


def invalidate_index_cache():
    global _faiss_index, _metadata
    _faiss_index = None
    _metadata = None


_load_index()


# ── Ollama model detection (cache result to avoid repeated API calls) ───────
_cached_model = None


def get_model_name():
    global _cached_model
    if _cached_model:
        return _cached_model
    preferred = ['phi3', 'phi', 'qwen', 'gemma', 'mistral', 'llama']
    try:
        available = [m['model'] for m in ollama.list().get('models', [])]
        if not available:
            _cached_model = 'mistral'
            return _cached_model
        for pref in preferred:
            for m in available:
                if pref in m.lower():
                    _cached_model = m
                    print(f"✅ Ollama model: {_cached_model}")
                    return _cached_model
        _cached_model = available[0]
        return _cached_model
    except Exception:
        _cached_model = 'mistral'
        return _cached_model


# ── Keyword extraction ────────────────────────────────────────────────────────
# Common words to ignore — expanded to handle documents like the Companies Act which have a lot of boilerplate legalese that isn't useful for section matching.
_STOP = {
    # Generic English
    'the','a','an','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'shall','to','of','in','on','at','by','for','with','this','that','these',
    'those','it','its','and','or','but','not','no','nor','so','yet','both',
    'either','neither','as','if','then','than','when','where','which','who',
    'whom','whose','what','how','all','any','each','every','few','more',
    'most','other','some','such','only','same','own','just','because','into',
    'through','during','before','after','above','below','between','out','up',
    'down','from','about','against','along','among','around','across','per',
    'upon','within','without',
    # Legal boilerplate — too generic to be useful for section matching
    'therefore','hereby','therein','thereof','thereto','hereunder','herein',
    'said','section','sections','act','company','companies','person','persons',
    'provided','unless','accordance','pursuant','referred','under','made',
    'rules','regulations','order','orders','government','central','state',
    'india','indian','national','applicable','application','commencement',
    'short','title','extent','preliminary','chapter','part','arrangement',
    'schedule','form','forms','appointed','date','days','time','year','years',
    'omitted','substituted','inserted','amended','amendment',
    # Numbers as words
    'one','two','three','four','five','six','seven','eight','nine','ten',
}

# Legal terms that ARE useful for section matching — prefer these
_LEGAL_SIGNAL_WORDS = {
    'incorporation','memorandum','articles','formation','prospectus','allotment',
    'securities','shares','shareholders','directors','director','board','meeting',
    'annual','general','auditor','auditors','audit','accounts','financial',
    'statement','statements','dividend','dividends','debenture','debentures',
    'charges','charges','winding','liquidation','liquidator','tribunal',
    'amalgamation','merger','acquisition','takeover','buyback','insider',
    'trading','disclosure','compliance','register','registers','transfer',
    'transmission','nominee','nomination','voting','poll','proxy','quorum',
    'resolution','resolutions','special','ordinary','alteration','conversion',
    'subsidiary','holding','associate','related','party','transaction',
    'managerial','remuneration','appointment','removal','resignation',
    'inspection','investigation','penalty','offence','prosecution','appeal',
    'reconstruction','restructuring','arrangement','compromise','valuation',
    'registered','office','name','capital','authorized','subscribed','paid',
    'preference','equity','warrant','option','bonus','rights','issue','offer',
    'private','public','placement','dematerialized','depository','registrar',
    'advertisement','shelf','herring','criminal','civil','liability',
    'misstatement','document','certification','authentication','execution',
}


def extract_keywords(text: str, max_words: int = 12) -> str:
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text)
    seen        = set()
    signal_hits = []
    other_hits  = []

    for w in words:
        lw = w.lower()
        if lw in _STOP or lw in seen:
            continue
        seen.add(lw)
        if lw in _LEGAL_SIGNAL_WORDS:
            signal_hits.append(w)
        else:
            other_hits.append(w)

    # Fill quota: legal-signal words first, then generic unique words
    result = signal_hits[:max_words]
    if len(result) < max_words:
        result += other_hits[:max_words - len(result)]

    return " ".join(result) if result else text[:100]


# ── Search ────────────────────────────────────────────────────────────────────
def search(query: str, top_k: int = 3) -> list:

    if not _load_index():
        return []
    for num in re.findall(r'\b(\d{1,3})\b', query):
        for item in _metadata:
            if str(item.get("section_number")) == num:
                return [item]

    # Semantic search
    kw  = extract_keywords(query)
    vec = _embed_model.encode([kw], show_progress_bar=False).astype('float32')
    faiss.normalize_L2(vec)

    # Over-fetch then deduplicate by section_number
    fetch_k = top_k * 3
    distances, indices = _faiss_index.search(vec, fetch_k)

    seen_sections = set()
    results = []
    for idx in indices[0]:
        if idx < 0 or idx >= len(_metadata):
            continue
        item = _metadata[idx]
        sec_num = item.get("section_number")
        if sec_num in seen_sections:
            continue          # skip duplicate section
        seen_sections.add(sec_num)
        results.append(item)
        if len(results) >= top_k:
            break

    return results


# ── Answer generation ─────────────────────────────────────────────────────────
def generate_answer(query: str, results: list, file_excerpt: str = "") -> str:
    model_name = get_model_name()

    parts = []
    if file_excerpt:
        parts.append(f"Document (excerpt):\n{file_excerpt[:400]}")

    for r in results:
        snippet = r.get('content', '')[:200].replace('\n', ' ')
        parts.append(f"Sec {r['section_number']} – {r['section_title']}: {snippet}")

    context = "\n\n".join(parts)

    prompt = (
        "You are a concise Indian corporate law expert (Companies Act 2013).\n\n"
        f"{context}\n\n"
        "Give a SHORT analysis:\n"
        "1. What this document is about (1-2 lines)\n"
        "2. Key legal points (2-3 bullets)\n"
        "3. Compliance status (1 line)\n"
        "4. Recommended next step (1 line)\n"
    )

    response = ollama.chat(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        options={"num_predict": 350},
    )
    return response['message']['content']


# ── Pipeline helpers ──────────────────────────────────────────────────────────
def create_embeddings():
    import os
    data = json.load(open(DATA_PATH, encoding='utf-8'))
    texts, meta = [], []
    for item in data:
        text = f"Section {item['section_number']}: {item['section_title']} {item['content'][:300]}"
        texts.append(text)
        meta.append(item)
    print(f"📝 Encoding {len(texts)} sections (batch_size=64)...")
    embeddings = _embed_model.encode(texts, batch_size=64, show_progress_bar=True)
    os.makedirs("output", exist_ok=True)
    np.save(EMBEDDING_PATH, embeddings)
    with open(METADATA_PATH, "wb") as f:
        pickle.dump(meta, f)
    print("✅ Embeddings saved")


def build_faiss():
    embeddings = np.load(EMBEDDING_PATH).astype('float32')
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    faiss.write_index(index, FAISS_PATH)
    print("✅ FAISS index built (cosine / IndexFlatIP)")


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    query = input("Ask your legal question: ")
    results = search(query, top_k=3)
    print(f"\n📚 Matched sections: {[r['section_number'] for r in results]}\n")
    answer = generate_answer(query, results)
    print("\n🧠 Answer:\n", answer)