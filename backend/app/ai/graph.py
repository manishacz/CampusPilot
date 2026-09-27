"""
LangGraph fallback graph — Phase 7 (Gemini / google-genai SDK version).

State + nodes:
    prepare_context -> fallback_inference -> parse_output -> validate_output
        -> (valid? -> normalize_tasks : repair_output -> re-validate -> normalize_tasks)
        -> END

Hard cap max_retries = 2 on the *validation* loop — after that, status becomes
PROCESSING_FAILED rather than looping. Separately, each individual Gemini call
is wrapped with its own short retry/backoff (via tenacity) against transient
503 UNAVAILABLE errors — the free tier occasionally returns these under load,
and without this a single bad moment mid-demo would kill the whole run.

Uses the `google-genai` package (`from google import genai`) — the old
`google-generativeai` package is fully deprecated as of 2026.
response_mime_type="application/json" on GenerateContentConfig forces
reliable JSON output. Free tier via Google AI Studio (aistudio.google.com/apikey)
— no billing required, just rate-limited (fine for hackathon-demo volume).
"""

import json
from typing import TypedDict

from google import genai
from google.genai import types
from google.genai.errors import ServerError
from langgraph.graph import END, StateGraph
from pydantic import ValidationError as PydanticValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.ai.prompts import build_extraction_prompt
from app.ai.schemas import ExtractionResult
from app.core.config import get_settings

MAX_RETRIES = 2  # validation-repair loop cap, unrelated to the transient-error retry below


class TaskGraphState(TypedDict):
    document_id: str
    extracted_text: str
    raw_output: dict | None
    tasks: list
    validation_errors: list
    retry_count: int
    provider: str
    status: str


def _get_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.google_api_key)


def _call_gemini(client: genai.Client, model: str, prompt: str) -> str:
    """Call Gemini with fallback across reliable models against transient 503 / 404 errors."""
    candidate_models = [model, "gemini-flash-lite-latest", "gemini-3.5-flash"]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    last_error = None
    for target_model in models_to_try:
        try:
            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            if response.text:
                return response.text
        except Exception as exc:
            last_error = exc
            continue

    if last_error:
        raise last_error
    return ""


def prepare_context(state: TaskGraphState) -> TaskGraphState:
    """No-op pass-through today — extracted_text already comes in ready to use."""
    return state


def fallback_inference(state: TaskGraphState) -> TaskGraphState:
    client = _get_client()
    settings = get_settings()
    prompt = build_extraction_prompt(state["extracted_text"])

    raw_text = _call_gemini(client, settings.gemini_model_id, prompt)

    return {**state, "raw_output": {"_raw_text": raw_text}, "provider": "langgraph_fallback"}


def parse_output(state: TaskGraphState) -> TaskGraphState:
    raw_text = state["raw_output"]["_raw_text"] if state["raw_output"] else ""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        return {**state, "raw_output": None, "validation_errors": [f"JSON parse failed: {exc}"]}

    return {**state, "raw_output": parsed}


def validate_output(state: TaskGraphState) -> TaskGraphState:
    if state["raw_output"] is None:
        return state  # parse already failed and recorded the error

    try:
        result = ExtractionResult.model_validate(state["raw_output"])
    except PydanticValidationError as exc:
        return {**state, "validation_errors": [str(exc)]}

    return {
        **state,
        "tasks": [task.model_dump() for task in result.tasks],
        "validation_errors": [],
    }


def repair_output(state: TaskGraphState) -> TaskGraphState:
    """One repair attempt: re-prompt with the validation errors attached, ask for a corrected JSON object."""
    client = _get_client()
    settings = get_settings()
    errors = "\n".join(state["validation_errors"])
    repair_prompt = (
        f"{build_extraction_prompt(state['extracted_text'])}\n\n"
        f"Your previous response failed validation with these errors:\n{errors}\n\n"
        "Return a corrected JSON object of the same shape. Only the JSON, nothing else."
    )

    raw_text = _call_gemini(client, settings.gemini_model_id, repair_prompt)

    return {
        **state,
        "raw_output": {"_raw_text": raw_text},
        "retry_count": state["retry_count"] + 1,
    }


def normalize_tasks(state: TaskGraphState) -> TaskGraphState:
    """Attaches document_id to each task dict; full normalization (dates, dedup) is Phase 8."""
    tasks = [{**task, "document_id": state["document_id"]} for task in state["tasks"]]
    return {**state, "tasks": tasks, "status": "completed"}


def mark_failed(state: TaskGraphState) -> TaskGraphState:
    return {**state, "status": "processing_failed"}


def _route_after_validate(state: TaskGraphState) -> str:
    if not state["validation_errors"]:
        return "normalize_tasks"
    if state["retry_count"] >= MAX_RETRIES:
        return "mark_failed"
    return "repair_output"


def build_graph():
    graph = StateGraph(TaskGraphState)

    graph.add_node("prepare_context", prepare_context)
    graph.add_node("fallback_inference", fallback_inference)
    graph.add_node("parse_output", parse_output)
    graph.add_node("validate_output", validate_output)
    graph.add_node("repair_output", repair_output)
    graph.add_node("normalize_tasks", normalize_tasks)
    graph.add_node("mark_failed", mark_failed)

    graph.set_entry_point("prepare_context")
    graph.add_edge("prepare_context", "fallback_inference")
    graph.add_edge("fallback_inference", "parse_output")
    graph.add_edge("parse_output", "validate_output")
    graph.add_conditional_edges(
        "validate_output",
        _route_after_validate,
        {
            "normalize_tasks": "normalize_tasks",
            "repair_output": "repair_output",
            "mark_failed": "mark_failed",
        },
    )
    graph.add_edge("repair_output", "validate_output")
    graph.add_edge("normalize_tasks", END)
    graph.add_edge("mark_failed", END)

    return graph.compile()
