<div align="center">

# ⚖️ LegalBuddy — AI-Powered Legal Document Intelligence

**Analyze Indian corporate legal documents in seconds using RAG + a locally-hosted LLM**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=flat-square)](https://ollama.ai/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue?style=flat-square)](https://faiss.ai/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

1. [What is LegalBuddy?](#-what-is-legalbuddy)
2. [Key Features](#-key-features)
3. [How it Works — End-to-End Flow](#-how-it-works--end-to-end-flow)
4. [Architecture Overview](#-architecture-overview)
5. [Backend Structure](#-backend-structure--modular-monolith)
6. [Frontend Structure](#-frontend-structure--feature-sliced-design)
7. [API Reference](#-api-reference)
8. [Environment Variables](#-environment-variables)
9. [Installation & Running](#-installation--running)
10. [Tech Stack Summary](#-tech-stack-summary)

---

## 🎯 What is LegalBuddy?

**LegalBuddy** is a full-stack AI platform for lawyers, compliance officers, and corporate legal teams. It lets you upload a PDF, DOCX, or TXT legal document and instantly receive a structured breakdown of:

- 📝 **Executive Summary** — concise overview of the document
- 📚 **Key Clauses** — identified clauses, provisions, and sections
- ✅ **Obligations** — parties' duties and commitments
- ⚠️ **Risks** — flagged risk areas, liabilities, and ambiguities
- 🏛️ **Compliance** — analysis against Indian Companies Act 2013 and 50+ corporate law frameworks

The entire RAG pipeline runs **100% locally** using Ollama — no data ever leaves your machine.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔐 **Secure Auth** | JWT + OTP two-factor login. Google reCAPTCHA v2 on signup/login |
| 👤 **Role System** | `admin` (platform owner) + `agent` (legal professionals) |
| 📁 **Document Processing** | PDF (pdfplumber/PyPDF2), DOCX (python-docx), TXT — up to 50 MB |
| 🤖 **RAG Pipeline** | Local FAISS + all-MiniLM-L6-v2 sentence embeddings |
| 🧠 **Local LLM** | Ollama-hosted model (qwen3:1.7b or any other compatible model) |
| ⏳ **Background Processing** | FastAPI `BackgroundTasks` with real-time status updates |
| ❌ **Cancel/Retry** | Users can stop analysis mid-pipeline and retry failed documents |
| 📊 **Daily Limits** | Configurable 5-document/day limit per agent with admin override |
| 🎛️ **Admin Panel** | Approve agents, view stats, reset document limits |
| 🔔 **Email Notifications** | SMTP credential delivery on agent approval |
| 🛡️ **Security** | Rate limiting (100/min), CORS, CSP headers, X-Request-ID tracing |

---

## 🔄 How it Works — End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT ANALYSIS FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

1. USER UPLOADS FILE (PDF / DOCX / TXT)
         │
         ▼
2. DOCUMENT SERVICE
   ├── Validates file type & size (≤ 50 MB, .pdf/.docx/.txt)
   ├── Checks concurrent task limit (1 active analysis per user)
   ├── Checks daily document limit (5/day per agent)
   ├── Saves file to disk (uploads/<user_id>/<username>/<filename>)
   └── Creates document record in MongoDB (status: UPLOADED)
         │
         ▼
3. RAG SERVICE — triggers BackgroundTask (status: QUEUED → PROCESSING)
         │
         ▼
4. INGESTION WORKER (_async_process_document)
   │
   ├── EXTRACTING  — pdfplumber / PyPDF2 / python-docx text extraction
   │
   ├── CHUNKING    — sliding window (500 words, 100 word overlap)
   │
   ├── EMBEDDING   — all-MiniLM-L6-v2 via SentenceTransformers
   │
   ├── INDEXING    — builds per-document Local FAISS index
   │
   ├── ANALYZING   — queries Global FAISS (Indian Corporate Law KB)
   │                 → retrieves top-K relevant law sections
   │                 → builds structured prompt with law context
   │                 → calls Ollama LLM to generate JSON response
   │
   └── COMPLETED   — stores result in MongoDB, status updated
         │
         ▼
5. FRONTEND POLLS /result/{doc_id} every 3 seconds
         │
         ▼
6. DISPLAY: Summary | Clauses | Obligations | Risks | Compliance
```

### Cancellation Flow
```
User clicks "Stop Analysis"
      │
      ▼
POST /api/documents/{doc_id}/cancel
      │
      ▼
MongoDB status → CANCELLED
      │
      ▼
Background worker checks status at next progress step
      │
      ▼
asyncio.CancelledError raised → pipeline halts gracefully
      │
      ▼
UI shows "Retry Analysis" button
```

---

## 🏗️ Architecture Overview

LegalBuddy uses a **true Microservices Architecture** — each service is a completely independent FastAPI process with its own port, its own startup, and its own lifecycle. Services communicate only via HTTP through the API Gateway. No Python imports cross service boundaries.

```
┌──────────────────────────────────────────────────────────────────────┐
│              FRONTEND (Vite + React)  :5173                          │
│              All API calls → http://localhost:5000                   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│               API GATEWAY  :5000  (FastAPI + httpx proxy)            │
│  CORS · Security Headers · Request ID Tracing · Route Resolution     │
│                                                                      │
│  /api/auth/*         → auth_service:8001                             │
│  /api/documents/*    → document_service:8002                         │
│  /summarize/*        → rag_service:8003                              │
│  /result/*           → rag_service:8003                              │
└────┬────────────────────────┬──────────────────────┬─────────────────┘
     │ HTTP                   │ HTTP                  │ HTTP
     ▼                        ▼                       ▼
┌─────────────┐     ┌──────────────────┐    ┌──────────────────────────┐
│ AUTH SERVICE│     │ DOCUMENT SERVICE │    │      RAG SERVICE         │
│   :8001     │     │      :8002       │    │         :8003             │
│             │     │                  │    │                          │
│ signup      │     │ upload           │    │ /summarize/{id} trigger  │
│ login + OTP │     │ list / delete    │    │ /result/{id} poll        │
│ verify-otp  │     │ serve file       │    │ /cancel                  │
│ admin panel │     │ reset-stuck      │    │ BackgroundTasks worker   │
└──────┬──────┘     └────────┬─────────┘    └──────────┬───────────────┘
       │                     │                          │
       └─────────────────────┴──────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │              SHARED LIBRARY                  │
              │  (imported by all services, no HTTP calls)   │
              │                                              │
              │  shared/config/settings.py                   │
              │  shared/database/ (MongoDB via Motor)        │
              │  shared/providers/ (Ollama, FAISS, Embedder) │
              │  shared/security/ (JWT)                      │
              │  shared/storage/ (file abstraction)          │
              └─────────────────────────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │         SHARED MONGODB (Motor async)         │
              │  users collection · documents collection     │
              └─────────────────────────────────────────────┘
```

---

## 📁 Backend Structure — True Microservices

```
legalbuddy/
│
├── backend/                             # The full backend codebase
│   ├── shared/                          # Shared Python library — imported by ALL services
│   │   ├── config/
│   │   │   └── settings.py              # Centralized config (reads from .env)
│   │   ├── database/
│   │   │   ├── mongo.py                 # DatabaseManager (Motor async client)
│   │   │   ├── document_repo.py         # DocumentRepository (CRUD + status updates)
│   │   │   └── user_repo.py             # UserRepository (agents + admin operations)
│   │   ├── providers/
│   │   │   ├── llm.py                   # OllamaProvider (async, semaphore-limited)
│   │   │   ├── embedding.py             # SentenceTransformerProvider (singleton)
│   │   │   └── vector_store.py          # FAISSVectorStore + LocalFAISSVectorStore
│   │   ├── security/
│   │   │   └── jwt.py                   # JWT creation & verification (HS256)
│   │   └── storage/
│   │       └── provider.py              # File storage abstraction (local disk)
│   │
│   ├── services/                        # Each is a standalone, independently runnable service
│   │   │
│   │   ├── api_gateway/                 ← PORT 5000 (public-facing)
│   │   │   ├── main.py                  # FastAPI app + httpx reverse proxy
│   │   │   └── Dockerfile
│   │   │
│   │   ├── auth_service/                ← PORT 8001
│   │   │   ├── main.py                  # Own FastAPI app instance
│   │   │   ├── router.py                # /api/auth/* endpoints
│   │   │   ├── service.py               # signup, login, OTP, approve_agent, reset_limit
│   │   │   ├── notification/
│   │   │   │   └── service.py           # SMTP email (credentials + OTP templates)
│   │   │   └── Dockerfile
│   │   │
│   │   ├── document_service/            ← PORT 8002
│   │   │   ├── main.py                  # Own FastAPI app instance
│   │   │   ├── router.py                # /api/documents/* endpoints
│   │   │   ├── service.py               # file validation, storage, DB record creation
│   │   │   └── Dockerfile
│   │   │
│   │   └── rag_service/                 ← PORT 8003
│   │       ├── main.py                  # Own FastAPI app instance
│   │       ├── router.py                # /summarize, /result, /cancel endpoints
│   │       ├── service.py               # Full RAG pipeline (chunking → embedding → LLM)
│   │       ├── extraction.py            # PDF/DOCX/TXT text extraction
│   │       ├── ingestion_worker/
│   │       │   └── tasks.py             # _async_process_document (BackgroundTask executor)
│   │       └── analysis/
│   │           └── prompts.py           # LLM prompt builder, classifier, response parser
│   │
│   ├── venv/                            # Python virtual environment
│   ├── requirements.txt                 # All Python dependencies
│   ├── run_dev.py                       # Dev script: starts all 4 services (Windows/Mac/Linux)
│   └── run_all.py                       # Dev script: starts all 4 services in a single terminal
│
├── docker-compose.yml                   # Start all 4 services with one command
└── .env                                 # Shared environment variables
```

### Key Design Decisions

| Pattern | Usage |
|---|---|
| **True Microservices** | Each service has its own `main.py`, port, and process — independently deployable |
| **API Gateway Proxy** | Single entry point at `:5000`; httpx forwards requests to internal services — frontend unchanged |
| **Shared Library** | `shared/` package imported by all services — no code duplication, no HTTP overhead for shared concerns |
| **No Cross-Service Python Imports** | `auth_service` never imports from `document_service` — only the gateway talks HTTP |
| **Repository Pattern** | `UserRepository` and `DocumentRepository` abstract all DB logic |
| **Singleton ML Providers** | SentenceTransformer + FAISS loaded once per process and reused |
| **BackgroundTasks** | FastAPI's native `BackgroundTasks` handles the async RAG pipeline within the RAG service |
| **Idempotent Worker** | Worker checks status before processing — safe to trigger twice |
| **Granular Statuses** | `UPLOADED → QUEUED → PROCESSING → EXTRACTING → CHUNKING → EMBEDDING → INDEXING → ANALYZING → COMPLETED / FAILED / CANCELLED` |

---




---

## 🖥️ Frontend Structure — Feature-Sliced Design

The frontend uses a **Feature-Sliced Design (FSD)** pattern, organizing code by feature domain rather than by technical layer:

```
frontend/
├── src/
│   ├── core/                            # App shell & layout
│   │   ├── App.jsx                      # Root component (auth gate)
│   │   ├── LayoutView.jsx               # Main layout (Sidebar + TopBar + page routing)
│   │   ├── SidebarView.jsx              # Sidebar nav, usage meter, theme toggle
│   │   └── TopBarView.jsx               # Page title + mobile menu button
│   │
│   ├── features/                        # Feature domains (self-contained)
│   │   ├── auth/
│   │   │   ├── views/
│   │   │   │   ├── LoginView.jsx        # Login form (email + password + reCAPTCHA)
│   │   │   │   └── SignupView.jsx       # Signup form (multi-field + reCAPTCHA)
│   │   │   └── models/
│   │   │       └── authStore.js         # Zustand store (login, logout, incrementDocCount)
│   │   │
│   │   ├── documents/
│   │   │   ├── views/
│   │   │   │   ├── DocumentsView.jsx    # Main documents page (upload, list, analysis UI)
│   │   │   │   └── FileViewerView.jsx   # In-browser file preview (PDF/DOCX/TXT)
│   │   │   ├── intents/
│   │   │   │   ├── useFileUpload.js     # Upload logic hook
│   │   │   │   └── useAnalysisPolling.js # Polling hook for processing status
│   │   │   └── models/
│   │   │       └── fileStore.js         # Zustand store (files, activeDoc, summaryData)
│   │   │
│   │   ├── dashboard/
│   │   │   └── views/
│   │   │       └── DashboardView.jsx    # Agent home page (recent docs, quick upload)
│   │   │
│   │   └── admin/
│   │       └── views/
│   │           ├── AdminPanelView.jsx   # Admin landing (overview + agent table)
│   │           └── AdminAgentDetailView.jsx # Agent detail (approve / reset limit)
│   │
│   ├── shared/                          # Cross-feature shared utilities
│   │   ├── utils/
│   │   │   └── api.js                   # All API calls (authAPI, documentAPI, summarizeAPI, adminAPI)
│   │   ├── store/
│   │   │   └── uiStore.js               # Zustand store (page, theme, sidebarOpen)
│   │   └── ui/
│   │       └── Loader.jsx               # ContentLoader skeleton component
│   │
│   ├── components/                      # Generic reusable UI components
│   ├── main.jsx                         # React entry point
│   └── index.css                        # Global styles + Tailwind base
│
├── vite.config.js                       # Vite + React + Tailwind plugin config
├── package.json                         # Dependencies
└── .env                                 # Frontend environment variables (see below)
```

### Key Design Decisions

| Pattern | Usage |
|---|---|
| **Feature-Sliced Design** | Code organized by feature domain (`auth/`, `documents/`, `admin/`) — not by type (`components/`, `hooks/`) |
| **Zustand Stores** | Three stores: `authStore` (user session), `fileStore` (doc state), `uiStore` (navigation/theme) |
| **Centralized API** | All HTTP calls go through `src/shared/utils/api.js` — one place to update base URL or auth headers |
| **Optimistic UI** | `incrementDocCount()` updates the sidebar usage bar immediately on upload without waiting for a server refetch |
| **Real-time Polling** | Frontend polls `/result/{doc_id}` every 3 seconds while any document is in a processing state |
| **Case-insensitive Status** | All status comparisons are `.toLowerCase()` — backend sends uppercase (`COMPLETED`), frontend maps correctly |
| **Page-based Routing** | No React Router — page state is managed by `uiStore.page` (a string key). Enables instant transitions |

---

## 🌐 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register a new agent (pending approval) |
| `POST` | `/api/auth/login` | ❌ | Login with email + password + reCAPTCHA |
| `POST` | `/api/auth/verify-otp` | ❌ | Verify OTP and receive JWT access token |
| `GET` | `/api/auth/me` | ✅ Bearer | Get current user profile |
| `GET` | `/api/auth/admin/agents/all` | ✅ Bearer | Admin: list all agents |
| `GET` | `/api/auth/admin/agents/pending` | ✅ Bearer | Admin: list pending approvals |
| `POST` | `/api/auth/admin/agents/approve/{id}` | ✅ Bearer | Admin: approve agent + send credentials |
| `POST` | `/api/auth/admin/agents/reset-limit/{id}` | ✅ Bearer | Admin: reset agent's daily upload count to 0 |
| `GET` | `/api/auth/admin/stats` | ✅ Bearer | Admin: platform statistics |

### Documents — `/api/documents`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload` | ✅ Bearer | Upload a document (PDF/DOCX/TXT) |
| `GET` | `/api/documents` | ✅ Bearer | List all documents for current user |
| `GET` | `/api/documents/{id}` | ✅ Bearer | Get document metadata |
| `DELETE` | `/api/documents/{id}` | ✅ Bearer | Delete document + file from disk |
| `GET` | `/api/documents/{id}/file` | ✅ Bearer | Serve raw file for in-browser preview |
| `POST` | `/api/documents/{id}/cancel` | ✅ Bearer | Cancel an in-progress analysis |
| `POST` | `/api/documents/reset-stuck` | ✅ Bearer | Force-fail all stuck documents |

### Analysis — RAG Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/summarize/{id}` | ✅ Bearer | Trigger RAG analysis (queues background task) |
| `GET` | `/result/{id}` | ✅ Bearer | Poll for analysis result |

### Infrastructure

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", version, services }` |
| `GET` | `/ready` | Returns `{ status: "ready" }` or 503 |
| `GET` | `/docs` | Swagger UI (interactive API docs) |

---

## ⚙️ Environment Variables

### Backend `.env` (at project root `c:\...\legalbuddy\.env`)

```env
# ── Server ──────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=5000
DEBUG=false

# ── MongoDB ─────────────────────────────────────────────────────
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=legalbuddy

# ── JWT ─────────────────────────────────────────────────────────
JWT_SECRET=your-very-long-random-secret-here
JWT_EXPIRE_HOURS=24

# ── Ollama LLM ───────────────────────────────────────────────────
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b        # or llama3, gemma2, mistral, etc.
OLLAMA_TIMEOUT=120             # seconds to wait before timeout

# ── File Storage ─────────────────────────────────────────────────
MAX_FILE_SIZE_MB=50

# ── RAG / Vector Search ──────────────────────────────────────────
CHUNK_SIZE_WORDS=500
CHUNK_OVERLAP_WORDS=100
TOP_K_GLOBAL=5                 # how many law sections to retrieve from global KB
TOP_K_LOCAL=3                  # how many chunks to retrieve from local document
CONTEXT_MAX_CHARS=1500

# ── FAISS Knowledge Base ─────────────────────────────────────────
FAISS_INDEX_PATH=output/faiss_index.bin
FAISS_METADATA_PATH=output/metadata.pkl

# ── CORS ─────────────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ── reCAPTCHA v2 ─────────────────────────────────────────────────
# Get yours at: https://www.google.com/recaptcha/admin/create
RECAPTCHA_SECRET=your-recaptcha-secret-key

# ── Email (SMTP — for agent credential delivery) ─────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password

# ── Redis (optional — not required for monolithic mode) ──────────
REDIS_URL=redis://localhost:6379/0
```

### Frontend `.env` (at `frontend/.env`)

```env
# reCAPTCHA v2 site key (public — safe to expose)
# Get yours at: https://www.google.com/recaptcha/admin/create
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

> **reCAPTCHA Setup:** Go to [https://www.google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create), select **reCAPTCHA v2 ("I'm not a robot" checkbox)**, add `localhost` as a domain, and copy the **Site Key** into `frontend/.env` and the **Secret Key** into the backend `.env`.

---

## 🚀 Installation & Running

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| MongoDB | 6.0+ | Database (local or Atlas) |
| Ollama | Latest | Local LLM host |

### 1. Clone & Setup

```bash
git clone https://github.com/PankajSinghBisht018/indian-corporate-law-ai.git
cd legalbuddy
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv backend/venv

# Activate it (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Create your .env file at project root (see Environment Variables section above)
# Then run the backend
python run.py
```

The API will start at `http://localhost:5000`. Visit `http://localhost:5000/docs` for interactive Swagger docs.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env (see Environment Variables section above)

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

### 3.5 Alternative: Single-Terminal Dev Script

Instead of running each service manually, `run_all.py` starts the Auth, Document, RAG, and API Gateway services together as subprocesses of a single Python process — all four ports (`8001`, `8002`, `8003`, `5000`) come up from **one VS Code terminal window**, with their logs interleaved in that same window rather than spread across separate popped-up terminals.

```bash
cd backend
python run_all.py
```

This always launches the services using the project's own virtual environment interpreter (`backend/venv`), regardless of which Python is active on your system `PATH`, so it stays consistent across machines. Press `Ctrl+C` in that terminal to stop all four services at once.

> Use `run_dev.py` instead if you'd rather have each service in its own separate terminal window.

### 4. Ollama Setup (Local LLM)

```bash
# Install Ollama (Windows: https://ollama.ai/download)

# Pull a model — choose one:
ollama pull qwen3:1.7b       # fast, 1.7B params (default)
ollama pull llama3            # balanced, 8B params
ollama pull gemma2:2b         # lightweight alternative
ollama pull mistral           # strong reasoning

# Ollama runs automatically as a service on http://127.0.0.1:11434
# Set OLLAMA_MODEL in your .env to match what you pulled
```

### 5. Build FAISS Knowledge Base (first time)

The global Indian Corporate Law knowledge base must be built once before the RAG pipeline can retrieve law sections:

```bash
# From the project root (with venv active)
python -m backend.scripts.build_index  # or equivalent ingestion script
```

This generates `output/faiss_index.bin` and `output/metadata.pkl` — pointed to by `FAISS_INDEX_PATH` and `FAISS_METADATA_PATH` in `.env`.

---

## 🛠️ Tech Stack Summary

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| **API Framework** | FastAPI 0.115 | Async web framework, OpenAPI docs |
| **Server** | Uvicorn | ASGI server |
| **Database** | MongoDB + Motor | Async document store for users & documents |
| **ORM/Repo** | Custom Repository Pattern | `UserRepository`, `DocumentRepository` |
| **LLM** | Ollama (local) | Runs models like qwen3, llama3, mistral locally |
| **Embeddings** | SentenceTransformers (`all-MiniLM-L6-v2`) | Document & law section embedding |
| **Vector Search** | FAISS | Similarity search over law knowledge base + per-doc index |
| **Auth** | JWT (HS256) + bcrypt | Token-based auth with password hashing |
| **OTP** | `pyotp` / custom | Two-factor login verification |
| **CAPTCHA** | Google reCAPTCHA v2 | Signup/login bot protection |
| **Background Jobs** | FastAPI `BackgroundTasks` | Async document processing pipeline |
| **Rate Limiting** | SlowAPI | 100 req/min per IP |
| **Email** | SMTP via `smtplib` | Agent credential delivery |
| **PDF Extraction** | pdfplumber + PyPDF2 | Text extraction from PDF files |
| **DOCX Extraction** | python-docx | Text extraction from Word documents |
| **Logging** | `python-json-logger` | Structured JSON logs to file + console |
| **Config** | `python-dotenv` | `.env`-based configuration |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 | UI component tree |
| **Build Tool** | Vite 6 | Dev server + production bundler |
| **Styling** | TailwindCSS 4 | Utility-first CSS |
| **State Management** | Zustand | Lightweight global stores (auth, files, UI) |
| **Animations** | Framer Motion | Page transitions, micro-animations |
| **Icons** | Lucide React | Icon set |
| **Toast Notifications** | react-hot-toast | Non-blocking user feedback |
| **CAPTCHA** | react-google-recaptcha | reCAPTCHA v2 widget |
| **Architecture** | Feature-Sliced Design | Domain-driven folder structure |
| **Routing** | Store-based (Zustand `uiStore.page`) | No React Router — page as state |

---

## 👥 User Roles

### Agent (Legal Professional)
- Registers via signup form → waits for admin approval
- Receives temporary password via email on approval
- Logs in with email + password + OTP
- Can upload up to **5 documents per day**
- Can view, analyze, cancel, retry, and delete their own documents
- Sidebar shows live Daily Usage bar + countdown to reset

### Admin (Platform Owner)
- Hardcoded email(s) in `auth_service/service.py` are auto-provisioned as admin on first login
- Can view all registered agents
- Can approve pending agents (triggers email with credentials)
- Can reset any agent's daily document limit to 0
- Can view platform-wide statistics

---

## 🔒 Security Features

- **JWT tokens** with configurable expiry (default: 24 hours)
- **bcrypt** password hashing
- **OTP two-factor authentication** on login
- **Google reCAPTCHA v2** on signup and login
- **Rate limiting**: 100 requests/minute per IP via SlowAPI
- **Security response headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`
- **Request ID middleware**: Every response carries a unique `X-Request-ID` for tracing
- **CORS**: Configured per environment via `CORS_ORIGINS` in `.env`
- **Document ownership validation**: All document routes verify the requesting user owns the document

----

## 🗺️ Roadmap & Known Limitations

- [ ] Add support for scanned/image-based PDFs via OCR
- [ ] Multi-document comparison view
- [ ] Support for additional local LLMs beyond Ollama-hosted models
- [ ] Dockerize the FAISS knowledge base build step
- [ ] Add automated tests (pytest for backend, Vitest for frontend)
- [ ] Pagination for large document lists in the dashboard

## 👥 Contributors

This project was built collaboratively by a team of 6:

| Name | GitHub | Role |
|---|---|---|
| Kritik Kaushik |(https://github.com/KritikKaushik) 
| Ahana Gupta | (https://github.com/AhanaGupta004) 
| Pankaj Singh Bisht | (https://github.com/PankajSinghBisht018) 
| Harpreet Singh | (https://github.com/harpreetsingh21-cloud) 
| Kamakshi Arora | (https://github.com/kamakshi-13) 
| Lakshya Kansal | (https://github.com/Lakshya1126)
| ... | ... | ... |
| ... | ... | ... |

Contributions are welcome — see [Contributing](#-contributing) below.

## 🩺 Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| `Connection refused` on port 11434 | Ollama not running | Run `ollama serve` or check the Ollama tray app is active |
| Analysis stuck on `PROCESSING` | Backend crashed mid-pipeline | Call `POST /api/documents/reset-stuck` or restart `rag_service` |
| `MONGODB connection failed` | MongoDB not running locally | Start MongoDB with `mongod` or check `MONGODB_URL` in `.env` |
| reCAPTCHA not loading | Site key missing/incorrect | Verify `VITE_RECAPTCHA_SITE_KEY` matches your reCAPTCHA admin console |
| FAISS index not found | Knowledge base not built yet | Run the build script in step 5 of Installation |
| Upload fails silently | File exceeds 50 MB or wrong type | Only `.pdf`, `.docx`, `.txt` under `MAX_FILE_SIZE_MB` are accepted |

<div align="center">

Built By Kritik Kaushik ,Pankaj Singh Bisht, Harpreet Singh , Kamakshi Arora , Lakshya Kansal and Team

</div>
