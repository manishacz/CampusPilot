"""
Task normalization — Phase 8.1.

Bridges the extraction router's raw output (ExtractedTask-shaped dicts,
source_ref nested) into the frozen Task model (source_page/source_bbox
flat, task_id/status/ai_provider/created_at added). Also standardizes
dates, dedupes near-identical tasks, strips filler wording from titles.
"""

import difflib
import re
import uuid
from datetime import datetime, timezone

from app.models.task import AIProvider, ConfidenceLevel, Task, TaskCategory, TaskStatus
from app.services.priority_service import score_task, score_to_enum_priority

FILLER_PATTERNS = [
    r"^please note that\s*",
    r"^students are hereby informed that\s*",
    r"^it is notified that\s*",
    r"^kindly note\s*",
]
DEDUP_SIMILARITY_THRESHOLD = 0.85


def _clean_title(title: str) -> str:
    cleaned = title.strip()
    for pattern in FILLER_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
    return cleaned[:1].upper() + cleaned[1:] if cleaned else cleaned


def _normalize_deadline(deadline: str | None) -> str | None:
    if not deadline:
        return None
    try:
        return datetime.fromisoformat(deadline).date().isoformat()
    except ValueError:
        return None  # never guess — matches the extraction prompt's own rule


def _dedupe(raw_tasks: list[dict]) -> list[dict]:
    kept: list[dict] = []
    for candidate in raw_tasks:
        candidate_title = candidate["title"].lower().strip()
        is_duplicate = any(
            candidate.get("category") == existing.get("category")
            and difflib.SequenceMatcher(None, candidate_title, existing["title"].lower().strip()).ratio()
            >= DEDUP_SIMILARITY_THRESHOLD
            for existing in kept
        )
        if not is_duplicate:
            kept.append(candidate)
    return kept


def build_tasks(document_id: str, raw_tasks: list[dict], provider: str) -> list[Task]:
    tasks: list[Task] = []
    for raw in _dedupe(raw_tasks):
        deadline = _normalize_deadline(raw.get("deadline"))
        score, justification = score_task(
            title=raw["title"],
            requirements=raw.get("requirements", []),
            eligibility=raw.get("eligibility", []),
            deadline=deadline,
        )
        source_ref = raw.get("source_ref") or {}

        tasks.append(
            Task(
                task_id=f"task-{uuid.uuid4()}",
                document_id=document_id,
                title=_clean_title(raw["title"]),
                category=TaskCategory(raw["category"]),
                deadline=deadline,
                eligibility=raw.get("eligibility", []),
                requirements=raw.get("requirements", []),
                priority=score_to_enum_priority(score),
                priority_score=score,
                priority_justification=justification,
                status=TaskStatus.PENDING,
                confidence=ConfidenceLevel(raw["confidence"]),
                source_page=source_ref.get("page"),
                source_bbox=source_ref.get("bbox"),
                ai_provider=AIProvider.BEDROCK if provider == "bedrock" else AIProvider.LANGGRAPH_FALLBACK,
                created_at=datetime.now(timezone.utc),
            )
        )
    return tasks


def apply_locale(task: Task, lang: str) -> dict:
    """Read-time overlay onto content already translated at ingestion
    (Phase 8.3) — no live LLM call here, so toggling language in the UI
    has zero external-network failure mode during a demo."""
    base = task.model_dump(mode="json")
    if lang == "en" or not task.localized_content or lang not in task.localized_content:
        return base
    localized = task.localized_content[lang]
    base["title"] = localized.get("title", base["title"])
    base["description"] = localized.get("description", base["description"])
    base["priority_justification"] = localized.get("priority_justification", base["priority_justification"])
    return base