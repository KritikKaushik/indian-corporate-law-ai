
import logging
import os
import pickle
from typing import Optional

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from backend.app.core.config import load_config

logger = logging.getLogger(__name__)

# ── Module-level singletons─
_faiss_index: Optional[faiss.Index] = None
_metadata: Optional[list] = None
_embed_model: Optional[SentenceTransformer] = None


# ── Load

def load_global_index() -> bool:
    """
    Load FAISS index + metadata from disk.
    """
    global _faiss_index, _metadata, _embed_model

    if _faiss_index is not None:
        return True  # already loaded

    config = load_config()
    idx_path  = config["faiss_index_path"]
    meta_path = config["faiss_metadata_path"]

    if not os.path.exists(idx_path) or not os.path.exists(meta_path):
        logger.warning(
            "[WARN] FAISS knowledge base not found.\n"
            f"     Expected: {idx_path}  and  {meta_path}\n"
            "     Run  python build_knowledge_base.py  to create it."
        )
        return False

    try:
        logger.info(f"[LOAD] Loading FAISS index from {idx_path}...")
        _faiss_index = faiss.read_index(idx_path)

        logger.info(f"[LOAD] Loading metadata from {meta_path}...")
        with open(meta_path, "rb") as fh:
            _metadata = pickle.load(fh)

        logger.info("[LOAD] Loading embedding model (all-MiniLM-L6-v2)...")
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")

        logger.info(
            f"[OK] FAISS index loaded: {_faiss_index.ntotal} vectors, "
            f"{len(_metadata)} metadata entries"
        )
        return True

    except Exception as exc:
        logger.error(f"[FAIL] Failed to load FAISS index: {exc}", exc_info=True)
        _faiss_index = _metadata = _embed_model = None
        return False


def is_index_loaded() -> bool:
    return _faiss_index is not None


# ── Search ────────

def search(query: str, top_k: int = 5) -> list[dict]:
    """
    Semantic search against the global Companies Act FAISS index.

    Args:
        query:  Natural language query
        top_k:  Number of results to return

    Returns:
        List of metadata dicts (section_number, section_title, content, score).
        Empty list if index unavailable or query is blank.
    """
    if not query or not query.strip():
        return []

    if not is_index_loaded():
        load_global_index()  # lazy retry
        if not is_index_loaded():
            logger.warning("[WARN] Global FAISS index unavailable — skipping law search")
            return []

    try:
        vec = _embed_model.encode([query]).astype("float32")
        faiss.normalize_L2(vec)

        k = min(top_k, _faiss_index.ntotal)
        distances, indices = _faiss_index.search(vec, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if 0 <= idx < len(_metadata):
                entry = dict(_metadata[idx])          # shallow copy
                entry["relevance_score"] = float(dist)
                results.append(entry)
                logger.debug(
                    f"   Hit: Section {entry.get('section_number','?')} — "
                    f"{entry.get('section_title','')[:60]} (score={dist:.4f})"
                )

        logger.info(f"[SEARCH] Global search returned {len(results)} Companies Act sections")
        return results

    except Exception as exc:
        logger.error(f"[FAIL] FAISS search error: {exc}", exc_info=True)
        return []


def build_law_context(results: list[dict], max_chars: int = 1500) -> str:
    """
    Concatenate retrieved sections into a context string for the LLM prompt.
    Respects the character budget.
    """
    if not results:
        return ""

    parts = []
    budget = max_chars
    for r in results:
        header = f"[{r.get('section_number','?')}] {r.get('section_title','')}"
        body   = r.get("content", "")[:600]
        chunk  = f"{header}\n{body}"
        if len(chunk) > budget:
            chunk = chunk[:budget]
        parts.append(chunk)
        budget -= len(chunk)
        if budget <= 0:
            break

    return "\n\n---\n\n".join(parts)
