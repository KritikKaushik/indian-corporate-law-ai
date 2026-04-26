"""
run.py — Entry point for Backend API
"""

import argparse
import asyncio
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run")

BANNER = """
╔══════════════════════════════════════════════════════════════╗
║                         Backend API                          ║
╚══════════════════════════════════════════════════════════════╝
"""


# ─────────────────────────────────────────
# Pre-flight checks
# ─────────────────────────────────────────

def check_env() -> None:
    if not os.path.exists(".env"):
        logger.warning("[WARN] .env file not found — using defaults / OS environment")
    else:
        logger.info("[OK] .env found")


def check_knowledge_base() -> None:
    from backend.app.core.config import load_config  

    config = load_config()
    idx = config["faiss_index_path"]
    meta = config["faiss_metadata_path"]

    if os.path.exists(idx) and os.path.exists(meta):
        size_mb = os.path.getsize(idx) / 1024 / 1024
        logger.info(f"[OK] Knowledge base found: {idx} ({size_mb:.1f} MB)")
    else:
        logger.warning(
            "[WARN] FAISS knowledge base not found!\n"
            "       RAG will fall back to document-only context.\n"
            "       Run: python build_knowledge_base.py"
        )


def check_ollama() -> bool:
    import urllib.request
    import json
    from backend.app.core.config import load_config

    config = load_config()
    url = config["ollama_base_url"] + "/api/tags"

    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
            models = [m["name"] for m in data.get("models", [])]

            logger.info(f"[OK] Ollama reachable — models: {models}")

            target = config["ollama_model"]
            if not any(target in m for m in models):
                logger.warning(
                    f"[WARN] Model '{target}' not found.\n"
                    f"       Run: ollama pull {target}"
                )
            return True

    except Exception as exc:
        logger.warning(
            f"[WARN] Cannot reach Ollama at {url}: {exc}\n"
            "       Start it using: ollama serve"
        )
        return False


async def check_mongo() -> bool:
    from motor.motor_asyncio import AsyncIOMotorClient
    from backend.app.core.config import load_config

    config = load_config()
    url = config["mongodb_url"]

    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        client.close()

        logger.info(f"[OK] MongoDB reachable → db={config['mongodb_db']}")
        return True

    except Exception as exc:
        logger.error(f"[FAIL] MongoDB connection failed: {exc}")
        return False


# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=None)
    parser.add_argument("--port", default=None, type=int)
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--workers", default=1, type=int)
    parser.add_argument("--skip-checks", action="store_true")

    args = parser.parse_args()

    print(BANNER)

    if not args.skip_checks:
        logger.info("─" * 50)
        logger.info("[CHECK] Pre-flight checks...")
        logger.info("─" * 50)

        check_env()
        check_knowledge_base()
        check_ollama()

        mongo_ok = asyncio.run(check_mongo())
        if not mongo_ok:
            logger.error("[ABORT] MongoDB is required. Exiting.")
            sys.exit(1)

        logger.info("─" * 50)
        logger.info("[OK] Pre-flight checks complete")
        logger.info("─" * 50)

    # Load config AFTER checks
    from backend.app.core.config import load_config
    config = load_config()

    host = args.host or config["host"]
    port = args.port or config["port"]
    reload = args.reload or config["debug"]
    workers = args.workers

    logger.info(
        f"[START] Uvicorn running on {host}:{port} "
        f"(reload={reload}, workers={workers})"
    )

    import uvicorn

    uvicorn.run(
        "backend.app.main:app",   # ✅ FIXED PATH
        host=host,
        port=port,
        reload=reload,
        workers=1 if reload else workers,
        log_level="info",
    )


if __name__ == "__main__":
    main()