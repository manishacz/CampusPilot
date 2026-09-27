"""
Task object — Phase 1 contract freeze.

Merges the PRD's extraction schema (section 6.1) with the field names
frontend/src/data/demoTasks.js already expects (task_id, priority, status,
source_page/source_bbox, confidence) — TaskCard/PriorityBadge/SourceViewer
render off these names directly. See ../../docs/api.md for the frozen
JSON contract this file implements.
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class TaskCategory(str, Enum):
    PLACEMENT = "placement"
    SCHOLARSHIP = "scholarship"
    EXAM = "exam"
    HOSTEL = "hostel"
    EVENT = "event"


class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AIProvider(str, Enum):
    BEDROCK = "bedrock"
    LANGGRAPH_FALLBACK = "langgraph_fallback"
    RULE_BASED = "rule_based"


class Location(BaseModel):
    name: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None


class Task(BaseModel):
    task_id: str
    document_id: str
    title: str
    description: str = ""
    category: TaskCategory
    deadline: str | None = None  # ISO-8601 date, e.g. "2026-09-20"; null if not extractable
    eligibility: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    priority: TaskPriority
    priority_score: int = Field(ge=0, le=100, default=0)
    priority_justification: str = ""
    localized_content: dict[str, dict[str, str]] | None = None
    location: Location | None = None
    status: TaskStatus = TaskStatus.PENDING
    confidence: ConfidenceLevel
    source_page: int | None = None
    source_bbox: list[float] | None = None  # [x, y, w, h], pass-through from Textract geometry
    ai_provider: AIProvider = AIProvider.BEDROCK
    created_at: datetime

    @field_validator("source_bbox")
    @classmethod
    def bbox_has_four_values(cls, v: list[float] | None) -> list[float] | None:
        if v is not None and len(v) != 4:
            raise ValueError("source_bbox must be [x, y, w, h] — exactly 4 values")
        return v


# ---- Request/response envelopes for the endpoints frozen in Phase 1 ----
# (routes implemented in api/tasks.py during Phase 9)

class TaskListResponse(BaseModel):
    tasks: list[Task]


class TaskUpdateRequest(BaseModel):
    """Body for PATCH /tasks/{task_id}. All fields optional — partial update."""
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    deadline: str | None = None
