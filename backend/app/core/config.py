
import os
from dotenv import load_dotenv

load_dotenv()

_config: dict | None = None


def get_config() -> dict:
    return {
        # Server
        "app_name":    "Legal AI RAG System",
        "app_version": "2.0.0",
        "host":        os.getenv("HOST", "0.0.0.0"),
        "port":        int(os.getenv("PORT", 5000)),
        "debug":       os.getenv("DEBUG", "false").lower() == "true",

        # MongoDB
        "mongodb_url": (
            os.getenv("MONGODB_URL")
            or os.getenv("MONGODB_URI")
            or "mongodb://localhost:27017"
        ),
        "mongodb_db":  os.getenv("MONGODB_DB", "legalbuddy"),

        # JWT
        "jwt_secret":       os.getenv("JWT_SECRET", "change-me-in-production"),
        "jwt_algorithm":    "HS256",
        "jwt_expire_hours": int(os.getenv("JWT_EXPIRE_HOURS", 24)),

        # File Upload
        "upload_base_dir":    "uploads",
        "max_file_size_mb":   int(os.getenv("MAX_FILE_SIZE_MB", 50)),
        "allowed_extensions": {"pdf", "docx", "txt"},

        # Ollama LLM
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        "ollama_model":    os.getenv("OLLAMA_MODEL", "qwen3:1.7b"),
        "ollama_timeout":  int(os.getenv("OLLAMA_TIMEOUT", 120)),

        # RAG / chunking
        "chunk_size_words":   int(os.getenv("CHUNK_SIZE_WORDS", 500)),
        "chunk_overlap_words": int(os.getenv("CHUNK_OVERLAP_WORDS", 100)),
        "top_k_global":       int(os.getenv("TOP_K_GLOBAL", 5)),
        "top_k_local":        int(os.getenv("TOP_K_LOCAL", 3)),
        "context_max_chars":  int(os.getenv("CONTEXT_MAX_CHARS", 1500)),

        # FAISS paths
        "faiss_index_path":    os.getenv("FAISS_INDEX_PATH",    "output/faiss_index.bin"),
        "faiss_metadata_path": os.getenv("FAISS_METADATA_PATH", "output/metadata.pkl"),

        # Cache
        "cache_ttl_hours": int(os.getenv("CACHE_TTL_HOURS", 24)),

        # CORS
        "cors_origins": os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173"
        ).split(","),
    }


def load_config() -> dict:
    global _config
    if _config is None:
        _config = get_config()
    return _config


def get_setting(key: str, default=None):
    return load_config().get(key, default)
