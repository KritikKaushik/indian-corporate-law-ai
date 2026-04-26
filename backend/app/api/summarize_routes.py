"""

  POST /summarize/{doc_id}      
  POST /api/summarize/{doc_id}    
  GET  /result/{doc_id}            
  GET  /summarize/{doc_id}         
  GET  /api/summarize/{doc_id}    
"""

import logging
import os
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, status

from backend.app.core.security import extract_user_from_token
from backend.app.db import mongo
from backend.app.services import llm_service
from backend.app.services import document_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["summarization"])


# ── Auth helper ───────────────────────

def _auth(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return extract_user_from_token(authorization.removeprefix("Bearer "))


# ── Background task ───────────────────

async def _run_analysis(user_id: str, doc_id: str, filepath: str, filename: str) -> None:
    logger.info("=" * 70)
    logger.info(f"[START] Analysis started — doc_id={doc_id}")
    logger.info("=" * 70)

    try:
        # 1. Extract text
        logger.info("[STEP 1/3] Extracting text...")
        text = document_service.extract_text(filepath, filename)

        if not text or not text.strip():
            raise ValueError("No extractable text in document")
        logger.info(f"[OK] Extracted {len(text):,} chars")

        # 2. RAG pipeline
        logger.info("[STEP 2/3] Running RAG analysis...")
        result = await llm_service.analyze_document(text)

        if result.get("error") and not result.get("summary"):
            raise ValueError(f"LLM pipeline failed: {result['error']}")

        # 3. Persist
        logger.info("[STEP 3/3] Persisting result...")
        await mongo.store_document_result(doc_id, result)

        logger.info("=" * 70)
        logger.info(f"[OK] Analysis complete — doc_id={doc_id}")
        logger.info("=" * 70)

    except Exception as exc:
        logger.error("=" * 70)
        logger.error(f"[FAIL] Analysis failed — doc_id={doc_id}: {exc}", exc_info=True)
        logger.error("=" * 70)

        # stcukkk erroor resolve 1.2v
        try:
            await mongo.update_document_status(doc_id, "failed")
            logger.info(f"[OK] Marked doc_id={doc_id} as FAILED")
        except Exception as db_exc:
            logger.critical(
                f"[CRITICAL] Could not update status for {doc_id}: {db_exc}",
                exc_info=True,
            )


# ── Shared trigger logic 

async def _trigger(doc_id: str, authorization: str | None, background_tasks: BackgroundTasks) -> dict:
    user_id = _auth(authorization)

    doc = await mongo.get_document(doc_id)
    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Document not found or access denied")

    filepath = doc.get("filepath", "")
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found on disk")

    current_status = doc.get("status", "unknown")
    if current_status == "processing" and not doc.get("result"):
        logger.warning(
            f"[WARN] doc_id={doc_id} stuck in 'processing' with no result — "
            "resetting and reprocessing (legacy v1 bug)"
        )
        await mongo.update_document_status(doc_id, "uploaded")
        current_status = "uploaded"

    # Already running legitimately
    if current_status == "processing":
        return {"doc_id": doc_id, "status": "processing", "message": "Already processing"}

    # Already done — return result inline so frontend doesn't need a second call
    if current_status == "done" and doc.get("result"):
        return {
            "doc_id":  doc_id,
            "status":  "done",
            "message": "Analysis already complete",
            **_format_result(doc["result"]),
        }

    # Mark processing BEFORE adding taskk to avoid race hell it
    await mongo.update_document_status(doc_id, "processing")
    logger.info(f"[OK] doc_id={doc_id} -> processing")

    background_tasks.add_task(
        _run_analysis, user_id, doc_id, filepath, doc["filename"]
    )
    logger.info(f"[QUEUED] Background task queued for doc_id={doc_id}")

    return {"doc_id": doc_id, "status": "processing", "message": "Analysis started"}


# ── POST /summarize/{doc_id} 
@router.post("/summarize/{doc_id}")
async def trigger_analysis(
    doc_id: str,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(None),
):
    """Trigger RAG analysis. Returns immediately; poll GET /result/{doc_id}."""
    return await _trigger(doc_id, authorization, background_tasks)


# ── POST /api/summarize/{doc_id} 

@router.post("/api/summarize/{doc_id}")
async def trigger_analysis_compat(
    doc_id: str,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(None),
):
    return await _trigger(doc_id, authorization, background_tasks)


# ── GET /result/{doc_id} 

@router.get("/result/{doc_id}")
async def get_result(doc_id: str, authorization: str | None = Header(None)):
    return await _result_response(doc_id, authorization)


# ── GET /summarize/{doc_id}   

@router.get("/summarize/{doc_id}")
async def get_result_compat(doc_id: str, authorization: str | None = Header(None)):
    """Alias for GET /result/{doc_id}."""
    return await _result_response(doc_id, authorization)


# ── GET /api/summarize/{doc_id} 

@router.get("/api/summarize/{doc_id}")
async def get_result_api_compat(doc_id: str, authorization: str | None = Header(None)):
    """Alias for GET /result/{doc_id} — matches old frontend path."""
    return await _result_response(doc_id, authorization)


# ── Shared result helper ──────────────

async def _result_response(doc_id: str, authorization: str | None) -> dict:
    user_id = _auth(authorization)

    doc = await mongo.get_document(doc_id)
    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Document not found or access denied")

    doc_status = doc.get("status", "unknown")

    if doc_status == "done":
        result = doc.get("result") or {}
        return {"doc_id": doc_id, "status": "done", **_format_result(result)}

    if doc_status == "failed":
        return {
            "doc_id": doc_id,
            "status": "failed",
            "error":  "Analysis failed. Re-upload the document and try again.",
        }

    # uploaded / processing / unknown
    return {"doc_id": doc_id, "status": doc_status}


def _format_result(result: dict) -> dict:
    """Ensure output always contains all five required fields."""
    return {
        "summary":     result.get("summary", ""),
        "clauses":     result.get("clauses", []),
        "obligations": result.get("obligations", []),
        "risks":       result.get("risks", []),
        "compliance":  result.get("compliance", ""),
    }
