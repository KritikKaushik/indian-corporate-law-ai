"""
llm_service.py —  RAG pipeline with full Indian corporate law context.

Pipeline (ONE LLM call):
  1. Detect document type (corporate / legal / general)
  2. Chunk user document → local FAISS → top-K relevant passages
  3. Semantic search → global Companies Act FAISS → top-K law sections
  4. Build iron-clad prompt with:
       - 50+ clause knowledge library
       - All major Indian corporate laws embedded
       - Document-type-aware instructions
  5. Single Ollama call 
  6. Multi-tier JSON parsing with field-level fallbacks
  7. Return structured result — never raises
"""
import asyncio
import json
import logging
import re
from typing import Optional

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import ollama

from backend.app.core.config import load_config
from backend.app.services import search_service

logger = logging.getLogger(__name__)


# CLAUSE KNOWLEDGE LIBRARY
# Every clause type the system knows about — used both in the prompt
 


CORPORATE_CLAUSES_LIBRARY: list[dict] = [
    # ── Core commercial clauses ───────────────────────────────────────────────
    {"id": "indemnification",       "name": "Indemnification Clause",           "category": "liability",    "keywords": ["indemnify", "indemnification", "hold harmless", "defend"]},
    {"id": "limitation_liability",  "name": "Limitation of Liability Clause",   "category": "liability",    "keywords": ["liability", "limit", "cap", "maximum", "damages"]},
    {"id": "force_majeure",         "name": "Force Majeure Clause",             "category": "performance",  "keywords": ["force majeure", "act of god", "unforeseen", "beyond control", "natural disaster"]},
    {"id": "arbitration",           "name": "Arbitration / Dispute Resolution", "category": "dispute",      "keywords": ["arbitration", "arbitrator", "dispute", "MSME", "Lok Adalat", "mediation"]},
    {"id": "governing_law",         "name": "Governing Law & Jurisdiction",     "category": "dispute",      "keywords": ["governing law", "jurisdiction", "courts of", "applicable law", "subject to"]},
    {"id": "confidentiality",       "name": "Confidentiality / NDA Clause",     "category": "ip",           "keywords": ["confidential", "non-disclosure", "NDA", "proprietary", "trade secret"]},
    {"id": "non_compete",           "name": "Non-Compete Clause",               "category": "restriction",  "keywords": ["non-compete", "non compete", "not engage", "compete", "competing business"]},
    {"id": "non_solicitation",      "name": "Non-Solicitation Clause",          "category": "restriction",  "keywords": ["non-solicitation", "non solicitation", "solicit", "poach", "hire away"]},
    {"id": "ip_ownership",          "name": "Intellectual Property Ownership",  "category": "ip",           "keywords": ["intellectual property", "IP", "copyright", "patent", "trademark", "invention", "work for hire"]},
    {"id": "assignment",            "name": "Assignment Clause",                "category": "transfer",     "keywords": ["assign", "assignment", "transfer", "novation", "delegate"]},
    {"id": "termination",           "name": "Termination Clause",               "category": "exit",         "keywords": ["terminate", "termination", "notice period", "end the agreement", "cancellation"]},
    {"id": "termination_cause",     "name": "Termination for Cause",            "category": "exit",         "keywords": ["terminate for cause", "material breach", "immediate termination", "without notice"]},
    {"id": "term_renewal",          "name": "Term & Renewal Clause",            "category": "duration",     "keywords": ["term", "duration", "renew", "renewal", "auto-renew", "expire"]},
    {"id": "payment_terms",         "name": "Payment Terms Clause",             "category": "financial",    "keywords": ["payment", "invoice", "fee", "consideration", "remuneration", "salary", "within 30 days"]},
    {"id": "penalty_interest",      "name": "Penalty / Late Payment Interest",  "category": "financial",    "keywords": ["penalty", "late payment", "interest", "delay", "overdue"]},
    {"id": "representations",       "name": "Representations & Warranties",     "category": "assurance",    "keywords": ["represent", "warrant", "warranty", "guarantee", "representation"]},
    {"id": "entire_agreement",      "name": "Entire Agreement / Merger Clause", "category": "structure",    "keywords": ["entire agreement", "merger clause", "supersede", "complete agreement"]},
    {"id": "amendment",             "name": "Amendment Clause",                 "category": "structure",    "keywords": ["amend", "amendment", "modify", "modification", "written consent"]},
    {"id": "waiver",                "name": "Waiver Clause",                    "category": "structure",    "keywords": ["waiver", "waive", "relinquish", "forbear"]},
    {"id": "severability",          "name": "Severability Clause",              "category": "structure",    "keywords": ["severability", "severable", "invalid provision", "unenforceable"]},
    {"id": "notices",               "name": "Notices Clause",                   "category": "structure",    "keywords": ["notice", "notification", "communicate", "registered post", "email notice"]},
    # ── Employment-specific clauses ───────────────────────────────────────────
    {"id": "probation",             "name": "Probation Period Clause",          "category": "employment",   "keywords": ["probation", "probationary", "trial period", "confirmation"]},
    {"id": "gratuity",              "name": "Gratuity Clause",                  "category": "employment",   "keywords": ["gratuity", "Payment of Gratuity Act", "5 years", "continuous service"]},
    {"id": "pf_esic",               "name": "PF / ESIC Deduction Clause",       "category": "employment",   "keywords": ["PF", "provident fund", "ESIC", "EPF", "employee state insurance"]},
    {"id": "leave_policy",          "name": "Leave Policy Clause",              "category": "employment",   "keywords": ["leave", "annual leave", "sick leave", "casual leave", "earned leave"]},
    {"id": "moonlighting",          "name": "Moonlighting / Dual Employment",   "category": "employment",   "keywords": ["moonlighting", "dual employment", "other employment", "outside work"]},
    {"id": "data_protection",       "name": "Data Protection Clause",           "category": "privacy",      "keywords": ["data protection", "personal data", "PDPB", "DPDP Act", "privacy", "GDPR"]},
    # ── Corporate / company law clauses ──────────────────────────────────────
    {"id": "board_resolution",      "name": "Board Resolution Authority",       "category": "corporate",    "keywords": ["board resolution", "board of directors", "authorized by board", "resolution passed"]},
    {"id": "authorized_signatory",  "name": "Authorized Signatory Clause",      "category": "corporate",    "keywords": ["authorized signatory", "authorized to sign", "signing authority", "power of attorney"]},
    {"id": "share_transfer",        "name": "Share Transfer Restriction",       "category": "corporate",    "keywords": ["share transfer", "transfer of shares", "ROFR", "right of first refusal", "lock-in"]},
    {"id": "dividend",              "name": "Dividend Policy Clause",           "category": "corporate",    "keywords": ["dividend", "profit distribution", "declared dividend", "interim dividend"]},
    {"id": "directorship",          "name": "Directorship / Appointment",       "category": "corporate",    "keywords": ["director", "appointment", "removal of director", "managing director", "whole-time director"]},
    {"id": "audit_clause",          "name": "Audit Rights Clause",              "category": "corporate",    "keywords": ["audit", "right to audit", "inspection", "books of accounts", "financial records"]},
    {"id": "related_party",         "name": "Related Party Transaction",        "category": "corporate",    "keywords": ["related party", "arm's length", "Section 188", "RPT", "associate company"]},
    # ── Finance / loan clauses ────────────────────────────────────────────────
    {"id": "security_collateral",   "name": "Security / Collateral Clause",     "category": "finance",      "keywords": ["security", "collateral", "mortgage", "pledge", "charge", "hypothecation"]},
    {"id": "covenant",              "name": "Covenant / Undertaking Clause",    "category": "finance",      "keywords": ["covenant", "undertaking", "promise", "shall not", "negative covenant"]},
    {"id": "default_events",        "name": "Events of Default",                "category": "finance",      "keywords": ["event of default", "default", "acceleration", "cross default"]},
    {"id": "prepayment",            "name": "Prepayment / Foreclosure",         "category": "finance",      "keywords": ["prepayment", "foreclosure", "early repayment", "prepayment penalty"]},
    # ── IP / Technology clauses ───────────────────────────────────────────────
    {"id": "license_grant",         "name": "License Grant Clause",             "category": "ip",           "keywords": ["license", "licence", "grant", "royalty", "sublicense", "perpetual", "limited license"]},
    {"id": "source_code_escrow",    "name": "Source Code Escrow",               "category": "ip",           "keywords": ["escrow", "source code", "code deposit", "technology escrow"]},
    {"id": "sla",                   "name": "Service Level Agreement (SLA)",    "category": "performance",  "keywords": ["SLA", "service level", "uptime", "availability", "response time", "99.9%"]},
    # ── Real estate clauses ───────────────────────────────────────────────────
    {"id": "rent_escalation",       "name": "Rent Escalation Clause",           "category": "realestate",   "keywords": ["rent escalation", "rent increase", "annual increase", "CPI", "escalation"]},
    {"id": "lock_in_lease",         "name": "Lock-in Period (Lease)",           "category": "realestate",   "keywords": ["lock-in", "lock in period", "minimum period", "cannot vacate"]},
    {"id": "security_deposit",      "name": "Security Deposit Clause",          "category": "realestate",   "keywords": ["security deposit", "refundable deposit", "advance deposit"]},
    # ── General protective clauses ────────────────────────────────────────────
    {"id": "dispute_escalation",    "name": "Dispute Escalation Mechanism",     "category": "dispute",      "keywords": ["escalation", "senior management", "escalate", "resolution committee"]},
    {"id": "liquidated_damages",    "name": "Liquidated Damages Clause",        "category": "liability",    "keywords": ["liquidated damages", "LD clause", "agreed damages", "penalty clause"]},
    {"id": "anti_corruption",       "name": "Anti-Bribery / Anti-Corruption",   "category": "compliance",   "keywords": ["anti-bribery", "anti-corruption", "Prevention of Corruption Act", "FCPA", "bribe"]},
    {"id": "change_of_control",     "name": "Change of Control Clause",         "category": "corporate",    "keywords": ["change of control", "acquisition", "merger", "takeover", "change in ownership"]},
    {"id": "most_favored",          "name": "Most Favoured Nation (MFN)",       "category": "commercial",   "keywords": ["most favoured", "most favored nation", "MFN", "best price", "equal treatment"]},
    {"id": "exclusivity",           "name": "Exclusivity Clause",               "category": "commercial",   "keywords": ["exclusivity", "exclusive", "sole supplier", "exclusive license", "exclusive distributor"]},
    {"id": "benchmarking",          "name": "Benchmarking / Market Testing",    "category": "commercial",   "keywords": ["benchmarking", "market testing", "competitive pricing", "benchmark"]},
    {"id": "step_in_rights",        "name": "Step-In Rights Clause",            "category": "performance",  "keywords": ["step-in", "step in right", "take over", "assume control", "remedy breach"]},
]

# Flat list of all clause names — injected into the prompt so LLM knows exactly what to detect
_CLAUSE_NAMES_LIST = "\n".join(
    f"  {i+1:02d}. {c['name']} [{c['category']}]"
    for i, c in enumerate(CORPORATE_CLAUSES_LIBRARY)
)


# INDIAN LAW REFERENCE EMBEDDED IN PROMPT


INDIAN_LAW_CONTEXT = """
INDIAN CORPORATE & COMMERCIAL LAW FRAMEWORK (Apply where relevant):

COMPANIES ACT 2013 — Key Sections:
  • Sec 2(68)  – Private Company definition (paid-up capital, share transfer restriction)
  • Sec 96/100 – AGM obligations; EGM procedures
  • Sec 117    – Filing of resolutions and agreements with ROC (within 30 days)
  • Sec 123    – Declaration of dividend; restrictions
  • Sec 134    – Directors' Responsibility Statement in Board's Report
  • Sec 135    – Corporate Social Responsibility (CSR) — companies with net profit ≥ ₹5 Cr
  • Sec 139    – Appointment of Auditor (max 2 terms of 5 yrs)
  • Sec 149    – Composition of Board; minimum directors; Independent Directors
  • Sec 152    – Appointment of Directors; DIN requirement
  • Sec 166    – Duties of Directors (fiduciary duty, no conflict of interest)
  • Sec 173    – Board Meetings; minimum 4 per year; 7-day notice
  • Sec 177    – Audit Committee; composition; functions
  • Sec 179    – Powers of Board of Directors
  • Sec 184    – Disclosure of Director's interest in contracts
  • Sec 185    – Prohibition on loans to Directors
  • Sec 186    – Loans and investments by companies
  • Sec 188    – Related Party Transactions (RPT); arm's length; Board/shareholder approval
  • Sec 197    – Managerial remuneration cap (11% of net profit)
  • Sec 203    – Appointment of Key Managerial Personnel (MD, CS, CFO)
  • Sec 230    – Compromise and arrangement
  • Sec 248    – Strike-off of company name

CONTRACT ACT 1872:
  • Valid contract requires: offer, acceptance, consideration, free consent, capacity, lawful object
  • Sec 27 – Void agreements in restraint of trade (non-compete enforceability)
  • Sec 73 – Compensation for loss or damage caused by breach
  • Sec 74 – Compensation for breach where penalty stipulated (liquidated damages)
  • Sec 124-125 – Contract of indemnity

LABOUR & EMPLOYMENT LAWS:
  • Industrial Disputes Act 1947 – notice periods, retrenchment compensation
  • Payment of Gratuity Act 1972 – 15 days per year, payable after 5 years service
  • Employees' Provident Funds Act 1952 – 12% employer + 12% employee contribution
  • ESIC Act 1948 – applicable where gross salary ≤ ₹21,000/month
  • Maternity Benefit Act 1961 – 26 weeks paid maternity leave
  • POSH Act 2013 – Sexual harassment policy mandatory for 10+ employees
  • Code on Wages 2019 – minimum wage, payment timelines
  • Shops and Establishments Act – varies by state

INTELLECTUAL PROPERTY:
  • Copyright Act 1957 – original works; employer owns work-for-hire
  • Patents Act 1970 – inventions; assignability
  • Trade Marks Act 1999 – registration; licensing
  • IT Act 2000 – electronic contracts; digital signatures; Sec 43A data protection

DATA PROTECTION:
  • DPDP Act 2023 (Digital Personal Data Protection) – consent, purpose limitation, data fiduciary obligations
  • IT Rules 2011 (SPDI Rules) – sensitive personal data handling

FINANCIAL & SECURITIES:
  • SEBI Act 1992 & SEBI (LODR) Regulations – listed company obligations
  • FEMA 1999 – foreign exchange; FDI; ODI regulations
  • IBC 2016 (Insolvency & Bankruptcy Code) – default, resolution, liquidation
  • PMLA 2002 – anti-money laundering; KYC obligations
  • Prevention of Corruption Act 1988 – anti-bribery
  • GST Act 2017 – tax on supply of goods/services

ARBITRATION:
  • Arbitration & Conciliation Act 1996 – domestic/international arbitration; enforcement
  • MSME Act 2006 – MSME disputes to MSEFC (within 45 days)
"""


# DOCUMENT TYPE KEYWORDS — for lightweight pre-classification


_LEGAL_DOC_SIGNALS = [
    "agreement", "contract", "deed", "memorandum", "articles", "resolution",
    "whereas", "hereinafter", "party of the first part", "in witness whereof",
    "notwithstanding", "pursuant to", "indemnify", "arbitration", "clause",
    "termination", "confidential", "hereto", "hereunder", "undertaking",
    "covenant", "representations", "warranties", "obligations", "liability",
    "consideration", "executed", "signed", "stamp duty", "notarized",
    "appointment letter", "offer letter", "employment", "salary", "probation",
    "joining date", "resignation", "service agreement", "scope of work",
]

def _classify_document(text: str) -> str:
    """
    Quick keyword-based document type classifier.
    Returns: "corporate_legal" | "general_legal" | "non_legal"
    """
    lower = text[:3000].lower()
    hits = sum(1 for kw in _LEGAL_DOC_SIGNALS if kw in lower)

    if hits >= 4:
        return "corporate_legal"
    if hits >= 2:
        return "general_legal"
    return "non_legal"



# EMBEDDING MODEL SINGLETON


_embed_model: Optional[SentenceTransformer] = None


def _get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        logger.info("[LOAD] Loading embedding model (all-MiniLM-L6-v2)...")
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("[OK] Embedding model ready")
    return _embed_model



# CHUNKING


def chunk_text(text: str, size: int = 500, overlap: int = 100) -> list[str]:
    words = text.split()
    if len(words) <= size:
        return [text] if text.strip() else []
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i : i + size]))
        i += size - overlap
    return chunks



# LOCAL FAISS CONTEXT


def _local_context(text: str, top_k: int = 4, max_chars: int = 2500) -> str:
    """
    Build on-the-fly FAISS over document chunks.
    Returns top-K most legally relevant passages concatenated.
    """
    config = load_config()
    try:
        chunks = chunk_text(
            text,
            size=config["chunk_size_words"],
            overlap=config["chunk_overlap_words"],
        )
        if not chunks:
            return text[:max_chars]

        model = _get_embed_model()
        vecs  = model.encode(chunks).astype("float32")
        index = faiss.IndexFlatL2(vecs.shape[1])
        index.add(vecs)

        query = (
            "legal clauses obligations duties liabilities compliance "
            "payment termination representations warranties indemnity "
            "breach penalty dispute jurisdiction governing law"
        )
        q_vec = model.encode([query]).astype("float32")
        k     = min(top_k, len(chunks))
        _, idxs = index.search(q_vec, k)

        selected = [chunks[i] for i in idxs[0] if 0 <= i < len(chunks)]
        # Also always include the first chunk (intro/parties usually matters)
        if chunks[0] not in selected:
            selected = [chunks[0]] + selected[:k-1]

        ctx = "\n\n---\n\n".join(selected)[:max_chars]
        logger.info(f"[LOCAL] {len(selected)} chunks selected, {len(ctx)} chars")
        return ctx

    except Exception as exc:
        logger.error(f"[FAIL] Local FAISS error: {exc}", exc_info=True)
        return text[:max_chars]



# PROMPT BUILDER


def build_prompt(doc_full: str, local_context: str, law_context: str, doc_type: str) -> str:
    """
    Build the legal summary prompt.
    Adapts based on whether the document is corporate/legal or general.
    """

    # ── Clause checklist injected into prompt ─────────────────────────────────
    clause_instruction = f"""
KNOWN CORPORATE CLAUSE TYPES (check which ones are PRESENT in the document):
{_CLAUSE_NAMES_LIST}

For each clause you identify as PRESENT, include it in the "clauses" array like:
"Indemnification Clause — [brief description of how it appears in this document]"
"""

    # ── Core task instructions (differ by doc type) ───────────────────────────
    if doc_type == "corporate_legal":
        task_block = f"""
TASK — FULL CORPORATE LEGAL ANALYSIS:

You MUST analyze every section of this document thoroughly.

1. SUMMARY (MANDATORY: minimum 120 words):
   - What type of document is this? (e.g., Service Agreement, Employment Contract, NDA, Board Resolution)
   - Who are the parties? What are their roles?
   - What is the core purpose and subject matter?
   - What is the contract value / financial consideration (if any)?
   - What is the duration / term of the agreement?
   - What jurisdiction / governing law applies?
   - Any unusual or notable features of this agreement?

2. CLAUSES — identify ALL corporate clauses present (aim for 5-10 clauses):
   Use the clause checklist above. For EACH clause found, write:
   "[Clause Name] — [exact meaning/impact as it appears in THIS document]"

3. OBLIGATIONS — list ALL concrete duties of EACH party (aim for 5-8 items):
   Be specific: "Party A must X within Y days" not generic statements.

4. RISKS — identify REAL risks (aim for 4-6 items):
   Legal risks, financial risks, operational risks, compliance gaps.
   Cite specific clauses or their absence as the source of risk.

5. COMPLIANCE — detailed analysis:
   - Which Indian laws apply to this document?
   - Are all statutory requirements met?
   - Any sections that violate or conflict with Indian law?
   - What filings/registrations are required (ROC, stamp duty, etc.)?
"""
    else:
        task_block = """
TASK — DOCUMENT ANALYSIS:

This document may not be a corporate/legal agreement, but analyze it fully:

1. SUMMARY (minimum 80 words):
   - What is this document?
   - What is its purpose?
   - Who is it for / who created it?
   - Key information it contains

2. CLAUSES — if any terms, conditions, or commitments exist, list them.
   If no formal clauses exist, write: []

3. OBLIGATIONS — any duties, commitments, or action items mentioned.
   If none, write: []

4. RISKS — any practical or legal concerns with this document.
   If none, write: []

5. COMPLIANCE — if any Indian law applies, mention it.
   If no specific law is relevant, explain the general legal nature.
"""

    # ── Full prompt──
    return f"""You are a senior Indian corporate lawyer with 20+ years of experience.
You have deep expertise in Companies Act 2013, Contract Act 1872, employment law, IP law, data protection, and all Indian commercial laws.
You analyze real documents with precision — you NEVER hallucinate, you NEVER make up facts not in the document.

{INDIAN_LAW_CONTEXT}

{'=' * 60}
COMPANIES ACT 2013 — RETRIEVED RELEVANT SECTIONS:
{law_context or "(Knowledge base not available — rely on embedded law context above)"}

{'=' * 60}
DOCUMENT TO ANALYZE (full text):
{local_context or doc_full[:2000]}

{'=' * 60}
{clause_instruction}

{'=' * 60}
{task_block}

{'=' * 60}
OUTPUT RULES (NON-NEGOTIABLE):
1. Output ONLY a single valid JSON object — nothing before it, nothing after it
2. NO markdown code fences (no ```json)
3. NO <think> or reasoning tags
4. NO placeholder text like "..." or "[insert]"
5. Every field MUST be populated based on the actual document
6. If a field genuinely has no content, use [] for arrays or "" for strings
7. "summary" MUST be at least 80 words — short summaries are WRONG
8. The JSON must start with {{ and end with }}

EXACT JSON SCHEMA TO FOLLOW:
{{
  "document_type": "<specific type, e.g., 'Service Agreement', 'Employment Contract', 'NDA', 'Board Resolution', 'Invoice', 'General Document'>",
  "summary": "<Detailed paragraph of minimum 80 words. Explain: what this document is, parties involved, core purpose, financial terms if any, duration, jurisdiction, and any notable features.>",
  "clauses": [
    "<Clause Name — specific description of how it appears in this exact document>",
    "<Clause Name — specific description>",
    "..."
  ],
  "obligations": [
    "<Party Name: specific obligation with timeline/condition if mentioned>",
    "..."
  ],
  "risks": [
    "<Specific risk description — cite the clause or its absence>",
    "..."
  ],
  "compliance": "<Detailed paragraph: which Indian laws apply, are statutory requirements met, required registrations/filings, any legal gaps or violations found.>"
}}

OUTPUT ONLY THE JSON. START WITH {{ END WITH }}"""



# LLM CALL


async def _call_llm(prompt: str, timeout: int) -> Optional[str]:
    config = load_config()
    model  = config["ollama_model"]
    logger.info(f"[LLM] Calling {model} (timeout={timeout}s, prompt={len(prompt)} chars)...")

    def _sync():
        return ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=False,
            options={
                "num_predict":    1500,   # enough for full detailed output
                "temperature":    0.15,   # low = consistent, accurate
                "top_k":          30,
                "top_p":          0.90,
                "repeat_penalty": 1.15,
                "stop": ["```", "Output:", "Note:", "I hope"],  # prevent prose leakage
            },
        )

    try:
        loop   = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _sync),
            timeout=timeout,
        )
        raw = result.get("message", {}).get("content", "").strip()

        # Strip Qwen3 / DeepSeek thinking blocks
        raw = re.sub(r"<think>[\s\S]*?</think>", "", raw, flags=re.DOTALL).strip()
        raw = re.sub(r"<thinking>[\s\S]*?</thinking>", "", raw, flags=re.DOTALL).strip()

        # Strip markdown code fences if model still outputs them
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE).strip()
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE).strip()

        # Strip escaped quotes wrapping the whole response
        if raw.startswith('"') and raw.endswith('"'):
            raw = raw[1:-1].replace('\\"', '"')

        logger.info(f"[LLM] Response received: {len(raw)} chars")
        return raw

    except asyncio.TimeoutError:
        logger.error(f"[TIMEOUT] LLM timed out after {timeout}s")
        return None
    except Exception as exc:
        logger.error(f"[FAIL] LLM error: {exc}", exc_info=True)
        return None



# JSON PARSING — 4-tier fallback


def _parse_response(raw: str, doc_type: str) -> dict:
    if not raw:
        return _fallback("LLM returned empty response")

    # Tier 1: direct parse
    try:
        return _validate(json.loads(raw), doc_type)
    except (json.JSONDecodeError, ValueError):
        pass

    # Tier 2: extract outermost {...} block
    match = re.search(r"\{[\s\S]+\}", raw)
    if match:
        try:
            return _validate(json.loads(match.group()), doc_type)
        except (json.JSONDecodeError, ValueError):
            pass

    # Tier 3: fix common LLM JSON mistakes and retry
    cleaned = _repair_json(raw)
    if cleaned:
        try:
            return _validate(json.loads(cleaned), doc_type)
        except (json.JSONDecodeError, ValueError):
            pass

    # Tier 4: regex text extraction (last resort)
    logger.warning("[PARSE] All JSON parsing failed — using regex extraction")
    return _extract_from_text(raw, doc_type)


def _repair_json(raw: str) -> Optional[str]:
    try:
        # Find the JSON block
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        candidate = raw[start:end]

        # Fix trailing commas before } or ]
        candidate = re.sub(r",\s*([\}\]])", r"\1", candidate)

        # Fix unquoted keys
        candidate = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', candidate)

        # Fix single-quoted strings
        candidate = candidate.replace("'", '"')

        return candidate
    except Exception:
        return None


def _validate(data: dict, doc_type: str) -> dict:
    """Normalise parsed dict, enforce minimum quality."""
    def to_list(v, limit: int) -> list[str]:
        if isinstance(v, list):
            return [str(x).strip() for x in v[:limit] if str(x).strip()]
        if isinstance(v, str) and v.strip():
            return [v.strip()]
        return []

    summary = str(data.get("summary", "")).strip()

    # Enforce minimum summary length
    if len(summary.split()) < 20:
        summary = (
            f"{summary} "
            f"This document has been analyzed for legal content, structure, "
            f"and compliance with applicable Indian laws."
        ).strip()

    return {
        "document_type": str(data.get("document_type", _infer_doc_type_label(doc_type))).strip()[:100],
        "summary":       summary[:1500],
        "clauses":       to_list(data.get("clauses"),     10),
        "obligations":   to_list(data.get("obligations"),  8),
        "risks":         to_list(data.get("risks"),        6),
        "compliance":    str(data.get("compliance", "")).strip()[:800],
    }


def _extract_from_text(text: str, doc_type: str) -> dict:
    """Regex-based extraction when all JSON parsing fails."""
    def after(label: str, max_chars: int = 600) -> str:
        m = re.search(
            rf'{label}\s*[:\-]?\s*(.+?)(?=\n\s*(?:clauses|obligations|risks|compliance|document_type|summary)\s*[:\-]|\Z)',
            text, re.IGNORECASE | re.DOTALL
        )
        return m.group(1).strip()[:max_chars] if m else ""

    def bullet_list(label: str, limit: int = 8) -> list[str]:
        m = re.search(
            rf'{label}\s*[:\-]?\s*([\s\S]+?)(?=\n\s*(?:clauses|obligations|risks|compliance|document_type|summary)\s*[:\-]|\Z)',
            text, re.IGNORECASE
        )
        if not m:
            return []
        block = m.group(1)
        items = re.findall(r'[-•*\d]+[.)]\s*(.+)', block)
        if not items:
            items = [line.strip() for line in block.split('\n') if line.strip() and len(line.strip()) > 10]
        return [i.strip() for i in items if i.strip()][:limit]

    return {
        "document_type": _infer_doc_type_label(doc_type),
        "summary":       after("summary", 1200) or text[:400],
        "clauses":       bullet_list("clauses", 10),
        "obligations":   bullet_list("obligations", 8),
        "risks":         bullet_list("risks", 6),
        "compliance":    after("compliance", 600),
    }


def _infer_doc_type_label(doc_type: str) -> str:
    mapping = {
        "corporate_legal": "Corporate Legal Document",
        "general_legal":   "Legal / Semi-Legal Document",
        "non_legal":       "General Document",
    }
    return mapping.get(doc_type, "Unknown Document Type")


def _fallback(reason: str) -> dict:
    return {
        "document_type": "Unknown",
        "summary":       f"Analysis could not be completed: {reason}",
        "clauses":       [],
        "obligations":   [],
        "risks":         [],
        "compliance":    "",
        "error":         reason,
    }



# PUBLIC API


async def analyze_document(text: str) -> dict:
    """
    Full RAG pipeline — ONE LLM call.
    """
    logger.info("=" * 65)
    logger.info("[START] Legal Document Analysis")
    logger.info("=" * 65)

    config = load_config()

    if not text or not text.strip():
        return _fallback("Document contains no extractable text")

    logger.info(f"[DOC] {len(text):,} chars | {len(text.split()):,} words")

    # Step 1: Classify document type
    doc_type = _classify_document(text)
    logger.info(f"[TYPE] Document classified as: {doc_type}")

    # Step 2: Local document context (FAISS on document chunks)
    logger.info("[STEP 1/4] Building local document context...")
    local_ctx = _local_context(
        text,
        top_k=config.get("top_k_local", 4),
        max_chars=config.get("context_max_chars", 2500),
    )

    # Step 3: Global Companies Act context
    logger.info("[STEP 2/4] Searching Companies Act knowledge base...")
    law_query = (local_ctx[:400] or text[:400])
    law_hits  = search_service.search(law_query, top_k=config.get("top_k_global", 5))
    law_ctx   = search_service.build_law_context(law_hits, max_chars=1500)
    logger.info(f"[LAW] Retrieved {len(law_hits)} sections, {len(law_ctx)} chars")

    # Step 4: Build prompt
    logger.info("[STEP 3/4] Building analysis prompt...")
    prompt = build_prompt(
        doc_full=text[:3000],
        local_context=local_ctx,
        law_context=law_ctx,
        doc_type=doc_type,
    )
    logger.info(f"[PROMPT] {len(prompt)} chars total")

    # Step 5: LLM call
    logger.info("[STEP 4/4] Calling LLM...")
    raw = await _call_llm(prompt, timeout=config["ollama_timeout"])

    if raw is None:
        result = _fallback("LLM timed out or returned empty response")
    else:
        result = _parse_response(raw, doc_type)

    logger.info("=" * 65)
    if "error" in result:
        logger.warning(f"[WARN] Analysis had error: {result['error']}")
    else:
        logger.info(f"[OK] Analysis complete — type={result.get('document_type')} "
                    f"summary_words={len(result.get('summary','').split())} "
                    f"clauses={len(result.get('clauses',[]))}")
    logger.info("=" * 65)

    return result
