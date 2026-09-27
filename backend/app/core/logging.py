"""
Phase 10: structured logging (request_id, document_id, provider, status,
latency_ms) feeding CloudWatch. Left minimal for Phase 0 — the default
uvicorn logger is enough until the AI pipeline exists.
"""
import logging


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
