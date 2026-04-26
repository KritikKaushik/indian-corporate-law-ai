<div align="center">

# ⚖️ LegalBuddy — AI-Powered Legal Document Intelligence Platform

**Analyze Indian corporate legal documents in seconds using RAG + Local LLMs**

[![FastAPI](https://img.shields.io/badge/FastAPI-5.0.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Ollama](https://img.shields.io/badge/Ollama-qwen3:1.7b-FF6B35?style=flat-square)](https://ollama.com/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector_Search-4285F4?style=flat-square)](https://faiss.ai/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#-api-reference)
- [RAG Pipeline](#-rag-pipeline)
- [Environment Variables](#-environment-variables)

---

## 🧠 Overview

**LegalBuddy** is a full-stack AI platform that enables lawyers, compliance officers, and corporate teams to instantly analyze legal documents against the **Indian Companies Act 2013** and 50+ corporate law frameworks. Upload a PDF, DOCX, or TXT — and get a structured breakdown of clauses, obligations, risks, and compliance status in seconds.

It uses a **Retrieval-Augmented Generation (RAG)** pipeline with a **locally-hosted LLM** (Ollama), meaning no data ever leaves your infrastructure.

### How It Works

```
User uploads PDF/DOCX/TXT
        ↓
Text Extraction (pdfplumber / PyPDF2 / python-docx)
        ↓
Chunking + Local FAISS Embedding (all-MiniLM-L6-v2)
        ↓
Global FAISS Search → Companies Act 2013 Knowledge Base
        ↓
Prompt Engineering (52 clause types + Indian law context)
        ↓
Ollama LLM (qwen3:1.7b) → JSON Response
        ↓
Structured Output: Summary | Clauses | Obligations | Risks | Compliance
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure signup/login with bcrypt password hashing and HS256 JWT tokens |
| 📄 **Multi-format Upload** | Supports PDF, DOCX, and TXT up to 50MB |
| 🧠 **RAG Pipeline** | Dual FAISS search — document-local + Companies Act global knowledge base |
| ⚖️ **52 Clause Types** | Detects indemnification, force majeure, arbitration, PF/ESIC, and 48 more |
| 🇮🇳 **Indian Law Context** | Built-in awareness of Companies Act 2013, DPDP Act, Gratuity Act, etc. |
| 🔄 **Async Processing** | Background task processing — never blocks the UI |
| 📊 **Structured Results** | Summary, identified clauses, obligations, risks, and compliance verdict |
| 🌙 **Dark / Light Theme** | Persistent theme toggle across sessions |
| 📁 **File Viewer** | Inline PDF/TXT/DOCX viewer inside the dashboard |
| 🔒 **Private File Serving** | JWT-gated file streaming — no public URLs |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│   React 19 + Vite 7  │  Tailwind CSS v4  │  Framer Motion  │
│            Zustand State    │    react-hot-toast             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP REST (localhost:5000)
┌───────────────────────────▼─────────────────────────────────┐
│                      API LAYER — FastAPI v5                  │
│  /api/auth/*  │  /api/documents/*  │  /summarize/*          │
│           CORS Middleware + JWT Bearer Auth                  │
└────────────┬──────────────┬──────────────┬──────────────────┘
             │              │              │
    ┌────────▼──┐  ┌────────▼──┐  ┌───────▼────────┐
    │ Auth      │  │ Document  │  │ LLM + Search   │
    │ Service   │  │ Service   │  │ Service (RAG)  │
    │ (bcrypt)  │  │(pdfplumber│  │ (FAISS+Ollama) │
    └────────┬──┘  │ PyPDF2   │  └───────┬────────┘
             │     │ python-  │          │
             │     │  docx)   │    ┌─────▼──────────────┐
    ┌────────▼──┐  └────┬─────┘    │   AI / ML LAYER    │
    │ MongoDB   │       │          │  Ollama (qwen3:1.7b)│
    │  Atlas    │  ┌────▼─────┐    │  SentenceTransformer│
    │ (Motor)   │  │  Disk    │    │  FAISS IndexFlatIP │
    └───────────┘  │ uploads/ │    │  Companies Act KB  │
                   └──────────┘    └────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | FastAPI 5.0 (Python 3.11+) | Async REST API |
| **Database** | MongoDB Atlas (Motor async driver) | Users + Documents + Results |
| **Auth** | PyJWT + bcrypt | Token-based authentication |
| **LLM** | Ollama `qwen3:1.7b` | Legal document analysis |
| **Embeddings** | `all-MiniLM-L6-v2` (SentenceTransformers) | Semantic vector search |
| **Vector Search** | FAISS `IndexFlatIP` | Cosine similarity search |
| **PDF Extraction** | pdfplumber (primary) + PyPDF2 (fallback) | Text extraction from PDFs |
| **DOCX Extraction** | python-docx | Text extraction from Word files |
| **Config** | python-dotenv | Environment variable management |
| **Logging** | Rotating file handler | `logs/legal_ai.log` |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 + Vite 7 | UI framework + build tool |
| **Styling** | Tailwind CSS v4  |
| **Animation** | Framer Motion 11 + GSAP 3 | Page transitions + smooth scroll |
| **State** | Zustand 5 | Global state management |
| **Icons** | Lucide React | Icon system |
| **Notifications** | react-hot-toast | Toast messages |
| **HTTP** | Native `fetch` | API communication |

---

## 📁 Project Structure

```

├── 📄 .env                          # Environment configuration
├── 📄 run.py                        # Uvicorn entrypoint
backend/
├── 🐍 app/                          # FastAPI application
│   ├── main.py                      # App factory + lifespan + CORS
│   ├── __init__.py
│   │
│   ├── api/                         # Route handlers
│   │   ├── auth_routes.py           # POST /api/auth/signup, /login
│   │   ├── document_routes.py       # CRUD /api/documents/*
│   │   ├── summarize_routes.py      # POST /summarize/{id}, GET /result/{id}
│   │   └── __init__.py
│   │
│   ├── core/                        # Cross-cutting concerns
│   │   ├── config.py                # Settings loader (dotenv → dict)
│   │   ├── security.py              # JWT mint + verify
│   │   └── __init__.py
│   │
│   ├── db/                          # Database layer
│   │   ├── mongo.py                 # Motor client + CRUD ops
│   │   └── __init__.py
│   │
│   └── services/                    # Business logic
│       ├── auth_service.py          # signup / login / password hashing
│       ├── document_service.py      # upload / extract text / list
│       ├── llm_service.py           # RAG pipeline (52 clause types)
│       ├── search_service.py        # FAISS singleton + semantic search
│       └── __init__.py
│
├── ⚛️  frontend/          # React application
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   │
│   └── src/
│       ├── App.jsx                  # Root — auth gate
│       ├── main.jsx                 # React DOM entry + initAuth
│       │
│       ├── components/
│       │   ├── Login.jsx            # Login + Signup forms
│       │   ├── Layout.jsx           # Shell (TopBar + Sidebar + pages)
│       │   ├── Sidebar.jsx          # Nav + theme toggle + user info
│       │   ├── Dashboard.jsx        # Upload + overview
│       │   ├── DocumentsView.jsx    # File list + analysis result tabs
│       │   ├── FileViewer.jsx       # Inline PDF/TXT/DOCX viewer
│       │   └── Loader.jsx           # Page + inline loaders
│       │
│       ├── store/
│       │   ├── authStore.js         # Zustand: isLoggedIn, user, login, logout
│       │   ├── fileStore.js         # Zustand: files, activeDocId, summaryData
│       │   └── uiStore.js           # Zustand: page, theme, sidebarOpen
│       │
│       └── utils/
│           └── api.js               # authAPI / documentAPI / summarizeAPI
│
├── 📦 output/                       # Knowledge base artifacts
│   ├── faiss_index.bin              # Compiled Companies Act FAISS index
│   ├── embeddings.npy               # Embedding vectors (numpy)
│   └── companies_act_dataset.json   # Source sections + metadata
│
├── 📁 uploads/                      # User-uploaded files (auto-created)
│   └── {username}-{user_id}/        # Per-user directory
│
└── 📋 logs/
    └── legal_ai.log                 # Rotating log (max 10MB × 3 backups)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **MongoDB Atlas** account (or local MongoDB instance)
- **Ollama** with `qwen3:1.7b` model pulled

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the LLM model
ollama pull qwen3:1.7b
```

---

### Backend Setup

**1. Clone and navigate**

```bash
git clone https://github.com/your-username/legalbuddy.git
cd legalbuddy
```

**2. Create and activate virtual environment**

```bash
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install fastapi uvicorn[standard] motor pymongo python-dotenv \
            pyjwt bcrypt pdfplumber PyPDF2 python-docx \
            faiss-cpu numpy sentence-transformers ollama
```

**4. Configure environment**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env .env.local
```

```env
# MongoDB
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?retryWrites=true
MONGODB_DB=legalbuddy

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE_HOURS=24

# Ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b
OLLAMA_TIMEOUT=120

# FAISS Knowledge Base
FAISS_INDEX_PATH=output/faiss_index.bin
FAISS_METADATA_PATH=output/metadata.pkl

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_FILE_SIZE_MB=50
```

**5. Start the backend**

```bash
python run.py
# or
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

The API will be live at **http://localhost:5000**  
Swagger docs at **http://localhost:5000/docs**

---

### Frontend Setup

**1. Navigate to the frontend directory**

```bash
cd frontend/LegalBuddy
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npm run dev
```

The frontend will be live at **http://localhost:5173**

**4. Build for production**

```bash
npm run build
npm run preview   # Preview the production build
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | `{email, password}` | Register new user (password ≥ 8 chars) |
| `POST` | `/api/auth/login` | `{email, password}` | Login and receive JWT token |

**Login Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user_id": "6635abc...",
  "email": "user@example.com"
}
```

---

### Documents

> All endpoints require `Authorization: Bearer <token>` header

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload a PDF/DOCX/TXT file (multipart) |
| `GET` | `/api/documents` | List all documents for the user |
| `GET` | `/api/documents/{doc_id}` | Get document metadata |
| `DELETE` | `/api/documents/{doc_id}` | Delete document + file from disk |
| `GET` | `/api/documents/{doc_id}/file` | Stream the raw file (for viewer) |
| `POST` | `/api/documents/reset-stuck` | Reset stuck "processing" documents |

**Upload Response:**
```json
{
  "success": true,
  "doc_id": "6635def...",
  "filename": "contract.pdf",
  "status": "uploaded",
  "message": "File uploaded. Call POST /summarize/{doc_id} to analyse."
}
```

---

### Analysis (RAG Pipeline)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/summarize/{doc_id}` | Trigger RAG analysis (async background task) |
| `GET` | `/result/{doc_id}` | Poll for analysis result |
| `GET` | `/health` | System health check |

**Analysis Result Response (status: done):**
```json
{
  "doc_id": "6635def...",
  "status": "done",
  "summary": "This is a Non-Disclosure Agreement between...",
  "clauses": [
    {
      "type": "Confidentiality / NDA Clause",
      "category": "ip",
      "text": "The receiving party shall not disclose...",
      "risk_level": "medium",
      "note": "Standard mutual NDA clause"
    }
  ],
  "obligations": ["Party A must return all documents within 30 days..."],
  "risks": ["No liability cap specified — unlimited exposure possible"],
  "compliance": "Partially compliant with Companies Act 2013 Section 117..."
}
```

**Status Flow:**
```
uploaded → processing → done
                     ↘ failed
```

---

## 🔍 RAG Pipeline

The LegalBuddy RAG pipeline runs in a FastAPI background task and follows these steps:

### Step 1 — Text Extraction
- **PDF**: pdfplumber (primary) → PyPDF2 (fallback)
- **DOCX**: python-docx paragraph extraction
- **TXT**: UTF-8 read with error replacement

### Step 2 — Document Chunking
- Splits text into 500-word chunks with 100-word overlap
- Encodes each chunk using `all-MiniLM-L6-v2` (384-dim vectors)
- Builds a local FAISS index for document-internal search

### Step 3 — Global Knowledge Base Search
- Queries the prebuilt Companies Act 2013 FAISS index
- Retrieves top-5 most relevant law sections
- Uses cosine similarity (L2-normalized IndexFlatIP)

### Step 4 — Prompt Construction
The prompt includes:
- All **52 clause types** with categories and keywords
- **Indian law context** (Companies Act 2013 key sections, Employment laws, etc.)
- Top-K retrieved **law sections** from Companies Act
- Top-K **document excerpts** from local search
- **Document type detection** (corporate / employment / real estate / general)

### Step 5 — LLM Inference
- Single call to Ollama `qwen3:1.7b`
- Response expected as structured JSON
- Multi-tier parsing with field-level fallbacks

### Step 6 — Persist & Return
- Result stored atomically in MongoDB `documents.result`
- Status updated to `done` or `failed`
- Frontend polls `GET /result/{doc_id}` until complete

---

## 🗄️ MongoDB Schema

### `users` Collection

```javascript
{
  _id:           ObjectId,
  email:         String,      // unique index
  password_hash: String,      // bcrypt hash
  created_at:    DateTime
}
```

### `documents` Collection

```javascript
{
  _id:        ObjectId,
  user_id:    ObjectId,       // FK → users._id  (indexed)
  filename:   String,
  filepath:   String,         // disk path
  status:     String,         // "uploaded" | "processing" | "done" | "failed"
  result:     {               // null until analysis complete
    summary:     String,
    clauses:     Array,
    obligations: Array,
    risks:       Array,
    compliance:  String
  },
  created_at: DateTime,       // indexed
  updated_at: DateTime
}
```

---

## 🔐 Security Notes

- All passwords hashed with **bcrypt** (auto-salted)
- JWT tokens expire in **24 hours** (configurable)
- File URLs are **not public** — require valid JWT to stream
- CORS is restricted to configured origins only
- Upload directory is user-scoped: `uploads/{username}-{user_id}/`
- Filenames are sanitized (removes special characters)

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | `legalbuddy` | Database name |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `JWT_EXPIRE_HOURS` | `24` | Token expiry in hours |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen3:1.7b` | Ollama model name |
| `OLLAMA_TIMEOUT` | `120` | LLM request timeout (seconds) |
| `FAISS_INDEX_PATH` | `output/faiss_index.bin` | Compiled FAISS index |
| `FAISS_METADATA_PATH` | `output/metadata.pkl` | Chunk metadata pickle |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size in MB |
| `CHUNK_SIZE_WORDS` | `500` | RAG chunk size (words) |
| `CHUNK_OVERLAP_WORDS` | `100` | RAG chunk overlap (words) |
| `TOP_K_GLOBAL` | `5` | FAISS global search results |
| `TOP_K_LOCAL` | `3` | FAISS local search results |

---