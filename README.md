AI LEGAL ASSISTANT FOR INDIAN CORPORATE LAW

--------------------------------------------------

1. PROJECT OVERVIEW

This project is an AI-powered Legal Assistant built using Retrieval-Augmented Generation (RAG). It uses structured datasets from Indian Corporate Laws (Companies Act, 2013) to answer legal queries.

The system allows users to:
- Ask legal questions
- Retrieve relevant sections
- Get simplified AI explanations

--------------------------------------------------

2. SYSTEM ARCHITECTURE

User Query
    ↓
Sentence Transformer (Embeddings)
    ↓
FAISS (Vector Database)
    ↓
Relevant Section Retrieval
    ↓
LLM (Mistral via Ollama)
    ↓
Final Answer

--------------------------------------------------

3. FEATURES

- Legal Question Answering
- Exact Section Lookup
- Semantic Search using FAISS
- AI-based Explanation using LLM
- Fast Local Execution (No API cost)

--------------------------------------------------

4. TECH STACK

Core Technologies:
- Python 3
- Sentence Transformers
- FAISS
- Ollama
- Mistral Model
- JSON Dataset

Data Processing:
- pdfplumber

--------------------------------------------------

5. PROJECT STRUCTURE

ai-legal-assistant/

main.py
build_section_dataset.py
extract_section_titles.py
pdf_extract.py

output/
    companies_act_dataset.json

requirements.txt
README.txt
.gitignore

--------------------------------------------------

6. SETUP INSTRUCTIONS

Step 1: Clone Repository

git clone <your-repo-link>
cd ai-legal-assistant

Step 2: Create Virtual Environment

python3 -m venv venv
source venv/bin/activate

Step 3: Install Dependencies

pip install -r requirements.txt

Step 4: Install Ollama

curl -fsSL https://ollama.com/install.sh | sh

Step 5: Download Model

ollama pull mistral

Step 6: Run Project

python main.py

--------------------------------------------------

7. EXAMPLE QUERIES

What is Section 247?
Explain quorum requirements
What are duties of auditors?

--------------------------------------------------

8. KEY IMPROVEMENTS

- Chunked embeddings for better search accuracy
- Hybrid search (Exact + Semantic)
- Prompt engineering for structured answers
- Switched from DeepSeek to Mistral for speed
- Optimized context size for faster responses

--------------------------------------------------

9. COMMON ERRORS AND FIXES

Error: ModuleNotFoundError
Fix: pip install -r requirements.txt

Error: ollama command not found
Fix: Install Ollama and restart terminal

Error: model 'mistral' not found
Fix: ollama pull mistral

Error: Slow response
Fix: Use mistral or phi3 instead of deepseek-r1

Error: Chinese output
Fix: Use mistral model

Error: search not defined
Fix: Ensure functions are defined above main block

Error: numpy/faiss not found
Fix: Activate virtual environment and reinstall packages

--------------------------------------------------

10. FUTURE IMPROVEMENTS

- Chat UI (Streamlit)
- PDF Upload and Analysis
- Legal Risk Detection
- LangChain Integration
- Deployment as Web Application

--------------------------------------------------

11. DISCLAIMER

All legal texts are sourced from official government portals such as India Code and MCA. This project is for educational and research purposes only.

--------------------------------------------------

12. AUTHOR

Kritik Kaushik
AI Legal Systems & RAG Engineering
