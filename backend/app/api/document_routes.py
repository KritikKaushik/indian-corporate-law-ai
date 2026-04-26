"""
  POST   /upload                  
  POST   /api/documents/upload     
  GET    /api/documents            
  GET    /api/documents/{id}       
  DELETE /api/documents/{id}     
  POST   /api/documents/reset-stuck 
"""
import logging
import os
from fastapi import APIRouter, File, Header, HTTPException, UploadFile, status
from backend.app.core.security import extract_user_from_token
from backend.app.db import mongo
from backend.app.services import document_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])


def _auth(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return extract_user_from_token(authorization.removeprefix("Bearer "))


# ── Shared upload handler ────

async def _handle_upload(file: UploadFile, authorization: str | None) -> dict:
    """Core upload logic shared by both route paths."""
    user_id = _auth(authorization)

    user = await mongo.find_user_by_id(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    content  = await file.read()
    username = user["email"].split("@")[0]

    doc = await document_service.process_file_upload(
        user_id, username, file.filename, content
    )

    logger.info(f"📤  Upload: {file.filename} → doc_id={doc['doc_id']}")
    return {
        "success":  True,
        "doc_id":   doc["doc_id"],
        "filename": doc["filename"],
        "status":   doc["status"],
        "message":  "File uploaded. Call POST /summarize/{doc_id} to analyse.",
    }


# ── POST /upload  (spec path) 

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str | None = Header(None),
):
    """Upload a legal document (PDF / DOCX / TXT)."""
    return await _handle_upload(file, authorization)


# ── POST /api/documents/upload  (frontend path) 


@router.post("/api/documents/upload")
async def upload_document_compat(
    file: UploadFile = File(...),
    authorization: str | None = Header(None),
):
    return await _handle_upload(file, authorization)


# ── GET /api/documents ───────

@router.get("/api/documents")
async def list_documents(authorization: str | None = Header(None)):
    """List all documents belonging to the authenticated user."""
    user_id = _auth(authorization)
    docs    = await document_service.list_user_documents(user_id)
    return {"documents": docs}


# ── POST /api/documents/reset-stuck ──────────


@router.post("/api/documents/reset-stuck")
async def reset_stuck_documents(authorization: str | None = Header(None)):
    user_id = _auth(authorization)
    db      = mongo.get_db()
    from bson.objectid import ObjectId
    from datetime import datetime, timezone

    result = await db.documents.update_many(
        {"user_id": ObjectId(user_id), "status": "processing"},
        {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
    )
    count = result.modified_count
    logger.info(f" reset-stuck: cleared {count} stuck docs for user {user_id}")
    return {
        "success": True,
        "reset_count": count,
        "message": f"Marked {count} stuck document(s) as failed. Re-upload to reprocess.",
    }


# ── GET /api/documents/{doc_id} ───────────────

@router.get("/api/documents/{doc_id}")
async def get_document(doc_id: str, authorization: str | None = Header(None)):
    """Get document metadata by ID."""
    user_id = _auth(authorization)
    return await document_service.get_document_info(user_id, doc_id)


# ── DELETE /api/documents/{doc_id} ────────────

@router.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, authorization: str | None = Header(None)):
    """Permanently delete a document and its file from disk."""
    user_id = _auth(authorization)
    doc     = await mongo.get_document(doc_id)

    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot delete this document")

    filepath = doc.get("filepath", "")
    if filepath and os.path.exists(filepath):
        os.remove(filepath)
        logger.info(f"🗑️   Deleted file: {filepath}")

    await mongo.delete_document(doc_id)
    return {"success": True, "message": "Document deleted"}


# ── GET /api/documents/{doc_id}/file  ────────
# Serves the actual uploaded file so the frontend can embed it in a viewer.

import mimetypes
from fastapi.responses import FileResponse

@router.get("/api/documents/{doc_id}/file")
async def serve_document_file(doc_id: str, authorization: str | None = Header(None)):
    user_id = _auth(authorization)
    doc = await mongo.get_document(doc_id)

    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")

    filepath = doc.get("filepath", "")
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found on disk")

    filename = doc.get("filename", "document")
    mime, _ = mimetypes.guess_type(filename)
    mime = mime or "application/octet-stream"

    return FileResponse(
        path=filepath,
        media_type=mime,
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
