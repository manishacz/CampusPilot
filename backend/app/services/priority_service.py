"""
Deterministic priority engine — Phase 8.2.

Note: the phase doc's scoring bands are CRITICAL/HIGH/MEDIUM/LOW (4 tiers),
but TaskPriority (frozen in Phase 1) only has HIGH/MEDIUM/LOW. CRITICAL
collapses into HIGH for the enum field below — the underlying 0-100
priority_score still preserves the distinction if you want to sort/filter
on it directly later.
"""

from datetime import datetime, timezone

from app.models.task import TaskPriority

URGENCY_KEYWORDS = ("urgent", "immediate", "immediately", "asap")
CONSEQUENCE_KEYWORDS = ("mandatory", "compulsory", "final", "last date", "disqualif", "no extension")


def _hours_until(deadline_iso: str | None) -> float | None:
    if not deadline_iso:
        return None
    try:
        deadline = datetime.fromisoformat(deadline_iso).replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    return (deadline - datetime.now(timezone.utc)).total_seconds() / 3600


def _deadline_urgency(deadline_iso: str | None) -> int:
    hours = _hours_until(deadline_iso)
    if hours is None:
        return 0
    if hours < 24:
        return 40
    if hours < 72:
        return 25
    return 0


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in keywords)


def score_task(title: str, requirements: list[str], eligibility: list[str], deadline: str | None) -> tuple[int, str]:
    """Returns (priority_score 0-100, human-readable justification)."""
    combined = " ".join([title, *requirements, *eligibility])

    deadline_points = _deadline_urgency(deadline)
    urgency_points = 25 if _contains_any(combined, URGENCY_KEYWORDS) else 0
    consequence_points = 20 if _contains_any(combined, CONSEQUENCE_KEYWORDS) else 0
    score = min(deadline_points + urgency_points + consequence_points, 100)

    reasons = []
    hours = _hours_until(deadline)
    if hours is not None and hours < 24:
        reasons.append(f"due in {max(int(hours), 0)}h")
    elif hours is not None and hours < 72:
        reasons.append("due within 3 days")
    if urgency_points:
        reasons.append("marked urgent")
    if consequence_points:
        reasons.append("mandatory/no-extension language")

    return score, (", ".join(reasons) if reasons else "no explicit urgency signals found")


def score_to_enum_priority(score: int) -> TaskPriority:
    if score >= 60:  # covers both CRITICAL (80-100) and HIGH (60-79) bands
        return TaskPriority.HIGH
    if score >= 30:
        return TaskPriority.MEDIUM
    return TaskPriority.LOW