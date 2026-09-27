"""
Document object — Phase 1 contract freeze, Phase 4 wires the routes that use it,
Phase 5 adds the TEXTRACT_COMPLETE status + textract_output_key.

Field names/shapes here are load-bearing: they must match
frontend/src/data/demoDocuments.js exactly, since the frontend renders
whichever shape it's given without translation. See ../../docs/api.md for
the frozen JSON contract this file implements.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    TEXTRACT_COMPLETE = "textract_complete"
    READY = "ready"
    FAILED = "failed"


class Document(BaseModel):
    document_id: str
    filename: str
    s3_key: str
    uploaded_at: datetime
    status: DocumentStatus = DocumentStatus.PROCESSING
    tasks_generated: int = 0
    type: str = "pdf"
    pages: int | None = None
    # Phase 5: S3 key of the Textract structured-output JSON, once available.
    # Optional/additive — existing frontend code ignores unknown fields, so
    # this doesn't touch the frozen Phase 1 contract for anything reading
    # the fields it already expects.
    textract_output_key: str | None = None


# ---- Request/response envelopes for the endpoints frozen in Phase 1 ----

class UploadUrlRequest(BaseModel):
    session_id: str
    filename: str


class UploadUrlResponse(BaseModel):
    upload_url: str
    document_id: str
    s3_key: str


class DocumentListResponse(BaseModel):
    documents: list[Document]


class ProcessRequest(BaseModel):
    session_id: str
