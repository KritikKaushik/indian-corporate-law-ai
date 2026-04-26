
import logging
import os
import re
from pathlib import Path

import pdfplumber
import PyPDF2
import docx as python_docx
from fastapi import HTTPException, status

from backend.app.core.config import load_config
from backend.app.db import mongo

logger = logging.getLogger(__name__)


# ── File helpers─────

def sanitize_filename(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^a-zA-Z0-9._\-]", "_", name).lstrip(".")
    return name[:255] or "document"


def get_upload_dir(username: str, user_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9_\-]", "_", username)
    return os.path.join("uploads", f"{safe}-{user_id}")


# ── Text extraction──

def extract_text(filepath: str, filename: str) -> str:
    """
    Extract plain text from PDF, DOCX, or TXT.
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        # Primary: pdfplumber
        try:
            with pdfplumber.open(filepath) as pdf:
                pages = [p.extract_text() or "" for p in pdf.pages]
            text = "\n".join(pages)
            if text.strip():
                logger.info(f"📄  pdfplumber: {len(text):,} chars from {len(pages)} pages")
                return text
        except Exception as e:
            logger.warning(f"⚠️   pdfplumber failed ({e}), trying PyPDF2 …")

        # Fallback: PyPDF2
        with open(filepath, "rb") as fh:
            reader = PyPDF2.PdfReader(fh)
            text = "".join(p.extract_text() or "" for p in reader.pages)
        logger.info(f"📄  PyPDF2: {len(text):,} chars")
        return text

    elif ext == ".docx":
        doc  = python_docx.Document(filepath)
        text = "\n".join(p.text for p in doc.paragraphs)
        logger.info(f"📄  DOCX: {len(text):,} chars")
        return text

    elif ext == ".txt":
        with open(filepath, "r", encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        logger.info(f"📄  TXT: {len(text):,} chars")
        return text

    raise ValueError(f"Unsupported file type: {ext}")


# ── Service functions

async def process_file_upload(
    user_id: str, username: str, filename: str, content: bytes
) -> dict:
    config = load_config()

    # Extension check
    ext = Path(filename).suffix.lstrip(".").lower()
    if ext not in config["allowed_extensions"]:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File type '{ext}' not allowed. Accepted: {config['allowed_extensions']}",
        )

    # Size check
    if len(content) > config["max_file_size_mb"] * 1024 * 1024:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds {config['max_file_size_mb']} MB limit",
        )

    # Save to disk
    upload_dir = get_upload_dir(username, user_id)
    Path(upload_dir).mkdir(parents=True, exist_ok=True)

    safe_name = sanitize_filename(filename)
    filepath  = os.path.join(upload_dir, safe_name)
    with open(filepath, "wb") as fh:
        fh.write(content)
    logger.info(f"💾  Saved upload: {filepath} ({len(content):,} bytes)")

    # DB record
    doc = await mongo.create_document(user_id, filename, filepath)
    return {
        "doc_id":     str(doc["_id"]),
        "filename":   doc["filename"],
        "filepath":   doc["filepath"],
        "status":     doc["status"],
        "created_at": doc["created_at"].isoformat(),
    }


async def list_user_documents(user_id: str) -> list[dict]:
    docs = await mongo.get_user_documents(user_id)
    return [
        {
            "doc_id":     str(d["_id"]),
            "filename":   d["filename"],
            "status":     d["status"],
            "created_at": d["created_at"].isoformat(),
        }
        for d in docs
    ]


async def get_document_info(user_id: str, doc_id: str) -> dict:
    doc = await mongo.get_document(doc_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    if str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
    return {
        "doc_id":     str(doc["_id"]),
        "filename":   doc["filename"],
        "status":     doc["status"],
        "created_at": doc["created_at"].isoformat(),
        "updated_at": doc.get("updated_at", doc["created_at"]).isoformat(),
    }
