"""
Thin service wrapper around ai/graph.py — Phase 7.
"""

from app.ai.graph import build_graph
from app.core.exceptions import ProcessingFailed

_compiled_graph = build_graph()


def run_langgraph_fallback(document_id: str, extracted_text: str) -> list[dict]:
    initial_state = {
        "document_id": document_id,
        "extracted_text": extracted_text,
        "raw_output": None,
        "tasks": [],
        "validation_errors": [],
        "retry_count": 0,
        "provider": "langgraph_fallback",
        "status": "in_progress",
    }

    final_state = _compiled_graph.invoke(initial_state)

    if final_state["status"] == "processing_failed":
        raise ProcessingFailed(
            f"LangGraph extraction failed for {document_id} after "
            f"{final_state['retry_count']} retries: {final_state['validation_errors']}"
        )

    return final_state["tasks"]
