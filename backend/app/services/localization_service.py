"""
Localization — Phase 8.3. Pre-computed once at ingestion (not per-request)
so the language toggle is instant with zero live-network dependency during
a demo. Batches every task for a document into a single Gemini call per
language (2 calls total, not 2*N tasks).

Uses the same google-genai client as ai/graph.py — this project's actual
LLM provider, since the Bedrock path never came up.
"""

import json

from google import genai
from google.genai import types
from google.genai.errors import ServerError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.task import Task

logger = get_logger(__name__)

SUPPORTED_LANGUAGES = {"hi": "Hindi", "kn": "Kannada"}

BATCH_PROMPT_TEMPLATE = """Translate the "title", "description", and "priority_justification" \
fields of each object below into {language_name}. Keep meaning precise — these are real \
student deadlines, not casual text. Return ONLY a JSON array, same length and order as the \
input, each object shaped {{"title": "...", "description": "...", "priority_justification": "..."}}.

Input:
{tasks_json}"""


def _get_client() -> genai.Client:
    return genai.Client(api_key=get_settings().google_api_key)


def _translate_batch(client: genai.Client, model: str, tasks: list[Task], lang_name: str) -> list[dict] | None:
    payload = [
        {"title": t.title, "description": t.description or "", "priority_justification": t.priority_justification}
        for t in tasks
    ]
    candidate_models = [model, "gemini-flash-lite-latest", "gemini-3.5-flash"]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    last_response = None
    for target_model in models_to_try:
        try:
            response = client.models.generate_content(
                model=target_model,
                contents=BATCH_PROMPT_TEMPLATE.format(language_name=lang_name, tasks_json=json.dumps(payload)),
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            if response.text:
                last_response = response.text
                break
        except Exception as exc:
            logger.warning("Localization model %s failed for %s: %s", target_model, lang_name, exc)
            continue

    if not last_response:
        return None

    try:
        parsed = json.loads(last_response)
    except json.JSONDecodeError as exc:
        logger.warning("Localization batch parse failed for %s: %s", lang_name, exc)
        return None
    if not isinstance(parsed, list) or len(parsed) != len(tasks):
        logger.warning("Localization batch for %s returned mismatched shape/length", lang_name)
        return None
    return parsed


def localize_tasks(tasks: list[Task]) -> list[Task]:
    """A failed/unavailable language is logged and skipped entirely — it
    never blocks the document from reaching 'ready'; the frontend just
    falls back to English for that language on this document."""
    if not tasks:
        return tasks
    settings = get_settings()
    client = _get_client()

    for lang_code, lang_name in SUPPORTED_LANGUAGES.items():
        try:
            results = _translate_batch(client, settings.gemini_model_id, tasks, lang_name)
        except Exception as exc:
            logger.warning("Gemini unavailable translating batch to %s: %s", lang_code, exc)
            continue
        if results is None:
            continue
        for task, localized in zip(tasks, results):
            task.localized_content = {**(task.localized_content or {}), lang_code: localized}

    return tasks