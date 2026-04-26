import logging
import logging.handlers
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import load_config
from backend.app.db import mongo
from backend.app.services import search_service
from backend.app.api import summarize_routes
from backend.app.api import auth_routes, document_routes


# ─────────────────────────────────────────
# Logging Setup
# ─────────────────────────────────────────

def setup_logging():
    os.makedirs("logs", exist_ok=True)

    root = logging.getLogger()
    root.setLevel(logging.WARNING)

    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        "%H:%M:%S"
    )

    # Console
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)

    # File (rotating)
    fh = logging.handlers.RotatingFileHandler(
        "logs/legal_ai.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=3
    )
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)

    root.addHandler(ch)
    root.addHandler(fh)

    logging.getLogger("app").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


setup_logging()
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# Lifespan (startup / shutdown)
# ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 LexAI Backend v5 starting...")

    await mongo.connect_db()

    loaded = search_service.load_global_index()
    logger.info(f"{'✅' if loaded else '⚠️'} FAISS {'ready' if loaded else 'unavailable'}")

    yield

    await mongo.close_db()
    logger.info("🛑 Shutdown complete")


# ─────────────────────────────────────────
# App Factory
# ─────────────────────────────────────────

def create_app() -> FastAPI:
    config = load_config()

    app = FastAPI(
        title="LexAI",
        version="5.0.0",
        lifespan=lifespan
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config["cors_origins"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(auth_routes.router)
    app.include_router(document_routes.router)
    app.include_router(summarize_routes.router)

    # Health check
    @app.get("/health", tags=["infra"])
    async def health():
        return {
            "status": "ok",
            "version": "5.0.0",
            "knowledge_base": "loaded"
            if search_service.is_index_loaded()
            else "unavailable",
        }

    # Root
    @app.get("/", tags=["infra"])
    async def root():
        return {
            "message": "LexAI Backend v5",
            "docs": "/docs"
        }

    return app


# ─────────────────────────────────────────
# ASGI Entry
# ─────────────────────────────────────────

app = create_app()