
import logging
from datetime import datetime, timedelta, timezone
from bson.objectid import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from backend.app.core.config import load_config

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


# ── Connection ─

async def connect_db() -> None:
    global _client, _db
    config = load_config()
    url = config["mongodb_url"]

    _client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
        socketTimeoutMS=8000,
        retryWrites=True,
    )
    await _client.admin.command("ping")
    _db = _client[config["mongodb_db"]]
    logger.info(f"[OK] MongoDB connected -> db={config['mongodb_db']}")

    # Indexes
    await _db.users.create_index("email", unique=True)
    await _db.documents.create_index("user_id")
    await _db.documents.create_index("created_at")
    logger.info("[OK] Indexes ensured")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialised — call connect_db() first")
    return _db


# ── Users 

async def create_user(email: str, password_hash: str) -> dict:
    db = get_db()
    doc = {
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def find_user_by_email(email: str) -> dict | None:
    return await get_db().users.find_one({"email": email})


async def find_user_by_id(user_id: str) -> dict | None:
    return await get_db().users.find_one({"_id": ObjectId(user_id)})


# ── Documents ─

async def create_document(user_id: str, filename: str, filepath: str) -> dict:
    db = get_db()
    doc = {
        "user_id":    ObjectId(user_id),
        "filename":   filename,
        "filepath":   filepath,
        "status":     "uploaded",          # uploaded → processing → done | failed
        "result":     None,                # analysis stored here when done
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.documents.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_document(doc_id: str) -> dict | None:
    try:
        return await get_db().documents.find_one({"_id": ObjectId(doc_id)})
    except Exception:
        return None


async def get_user_documents(user_id: str) -> list:
    cursor = get_db().documents.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    return await cursor.to_list(length=200)


async def update_document_status(doc_id: str, status: str) -> None:
    await get_db().documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
    )


async def store_document_result(doc_id: str, result: dict) -> None:
    """Persist analysis result + mark done in a single atomic write."""
    await get_db().documents.update_one(
        {"_id": ObjectId(doc_id)},
        {
            "$set": {
                "status":     "done",
                "result":     result,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )


async def delete_document(doc_id: str) -> None:
    await get_db().documents.delete_one({"_id": ObjectId(doc_id)})
