"""
Pydantic extraction schema — Phase 7.

Mirrors the PRD's strict JSON contract (section 6.1): this is what the
model must return, and what graph.py's validate_output node checks every
candidate response against before it's allowed to become a Task.
"""

from pydantic import BaseModel, Field, field_validator


class SourceRef(BaseModel):
    page: int
    bbox: list[float]

    @field_validator("bbox")
    @classmethod
    def bbox_has_four_values(cls, v: list[float]) -> list[float]:
        if len(v) != 4:
            raise ValueError("bbox must be [x, y, w, h] — exactly 4 values")
        return v


class ExtractedTask(BaseModel):
    """One task as the model must emit it — pre-normalization (Phase 8 does that)."""

    title: str
    category: str  # placement | scholarship | exam | hostel | event
    deadline: str | None = None  # ISO-8601 date or null
    eligibility: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    priority: str  # high | medium | low
    source_ref: SourceRef
    confidence: str  # high | medium | low

    @field_validator("category")
    @classmethod
    def category_is_known(cls, v: str) -> str:
        allowed = {"placement", "scholarship", "exam", "hostel", "event"}
        if v not in allowed:
            raise ValueError(f"category must be one of {sorted(allowed)}, got {v!r}")
        return v

    @field_validator("priority", "confidence")
    @classmethod
    def level_is_known(cls, v: str) -> str:
        allowed = {"high", "medium", "low"}
        if v not in allowed:
            raise ValueError(f"must be one of {sorted(allowed)}, got {v!r}")
        return v


class ExtractionResult(BaseModel):
    """The full model response for one document: a list of candidate tasks."""

    tasks: list[ExtractedTask] = Field(default_factory=list)
