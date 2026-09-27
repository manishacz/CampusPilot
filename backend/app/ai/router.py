"""
Extraction router — Phase 6/7.

Primary path is Bedrock; LangGraph is the resilience fallback, not a
second extraction engine — per the PRD's demo narrative. bedrock_service.py
is still an intentional empty stub (Phase 6 not implemented yet), so today
every document takes the fallback path. That's a valid, demoable terminal
state: it's the exact same code path a real Bedrock failure would take
once Phase 6 lands, so wiring this up now costs nothing to swap later —
this file doesn't change when bedrock_service.py gets real code, only
bedrock_extract's behavior does.
"""

from app.core.exceptions import AppError
from app.services import bedrock_service
from app.services.langgraph_service import run_langgraph_fallback


def process_document(document_id: str, extracted_text: str) -> dict:
    """Returns {"tasks": [...], "provider": "bedrock" | "langgraph_fallback"}."""
    bedrock_extract = getattr(bedrock_service, "bedrock_extract", None)

    if bedrock_extract is not None:
        try:
            tasks = bedrock_extract(document_id, extracted_text)
            return {"tasks": tasks, "provider": "bedrock"}
        except AppError:
            pass  # fall through to LangGraph below

    tasks = run_langgraph_fallback(document_id, extracted_text)
    return {"tasks": tasks, "provider": "langgraph_fallback"}
