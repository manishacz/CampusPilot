"""
Document endpoints — Phase 4/5/9: POST /process now runs the full pipeline,
not just Textract.

Textract only supports PDF and images. Office formats (docx, xlsx, pptx, …)
are extracted directly via the office_extractor_service before being fed into
the same AI pipeline.

URL structure supports both legacy (/documents) and user-scoped
(/{user_id}/documents) paths so the browser address bar shows the user id.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Response

from app.ai.router import process_document as run_extraction
from app.core.exceptions import AppError, NotFoundError
from app.core.logging import get_logger
from app.models.document import (
    Document, DocumentListResponse, DocumentStatus,
    ProcessRequest, UploadUrlRequest, UploadUrlResponse,
)
from app.repositories.document_repository import DocumentRepository
from app.repositories.task_repository import TaskRepository
from app.services.localization_service import localize_tasks
from app.services.office_extractor_service import extract_text_from_office, is_office_file
from app.services.s3_service import S3Service
from app.services.task_service import build_tasks
from app.services.textract_service import TextractService
from app.utils.validators import validate_filename

logger = get_logger("documents")

router = APIRouter(prefix="/documents", tags=["documents"])
_repo = DocumentRepository()
_task_repo = TaskRepository()
_s3 = S3Service()
_textract = TextractService()


@router.post("/upload-url", response_model=UploadUrlResponse)
def create_upload_url(payload: UploadUrlRequest) -> UploadUrlResponse:
    content_type = validate_filename(payload.filename)
    document_id = _s3.generate_document_id()
    s3_key = _s3.build_s3_key(document_id, payload.filename)
    upload_url = _s3.generate_presigned_put_url(s3_key, content_type)

    document = Document(
        document_id=document_id, filename=payload.filename, s3_key=s3_key,
        uploaded_at=datetime.now(timezone.utc), tasks_generated=0,
        type=content_type.split("/")[-1], pages=None,
    )
    _repo.create_document(payload.session_id, document)
    return UploadUrlResponse(upload_url=upload_url, document_id=document_id, s3_key=s3_key)


@router.get("", response_model=DocumentListResponse)
def list_documents(session_id: str = Query(...)) -> DocumentListResponse:
    return DocumentListResponse(documents=_repo.list_documents(session_id))


@router.get("/{document_id}", response_model=Document)
def get_document(document_id: str, session_id: str = Query(...)) -> Document:
    document = _repo.get_document(session_id, document_id)
    if document is None:
        raise NotFoundError(f"Document {document_id} not found")
    return document


@router.post("/{document_id}/process", response_model=Document)
def process_document(document_id: str, payload: ProcessRequest) -> Document:
    document = _repo.get_document(payload.session_id, document_id)
    if document is None:
        raise NotFoundError(f"Document {document_id} not found")

    # ------------------------------------------------------------------
    # Step 1: Extract text — route based on file format.
    #   • PDF / images  → Amazon Textract (async OCR job)
    #   • Office formats → download from S3, parse with python-docx / openpyxl / python-pptx
    # Both branches produce the same structured_output dict shape.
    # NOTE: We catch ALL exceptions here (not just AppError) because boto3,
    # python-docx, openpyxl and python-pptx can raise plain Python exceptions
    # that would otherwise leave the document stuck in "processing" status.
    # ------------------------------------------------------------------
    try:
        if is_office_file(document.s3_key):
            file_bytes = _s3.get_object_bytes(document.s3_key)
            structured_output = extract_text_from_office(document.s3_key, file_bytes)
        else:
            structured_output = _textract.run(document_id, document.s3_key)
    except AppError:
        _repo.update_status(payload.session_id, document_id, DocumentStatus.FAILED)
        raise
    except Exception as exc:
        logger.error("Extraction failed for %s: %s", document_id, exc, exc_info=True)
        _repo.update_status(payload.session_id, document_id, DocumentStatus.FAILED)
        raise AppError(f"Text extraction failed: {exc}") from exc

    output_key = f"textract/{document_id}/output.json"
    _s3.put_json(output_key, structured_output)
    _repo.update_status(
        payload.session_id, document_id, DocumentStatus.TEXTRACT_COMPLETE,
        textract_output_key=output_key, pages=structured_output["page_count"],
    )

    # ------------------------------------------------------------------
    # Step 2: AI extraction (Bedrock → LangGraph fallback) — unchanged.
    # ------------------------------------------------------------------
    extracted_text = "\n".join(
        f"page {line['page']} bbox={line.get('bbox')}: {line['text']}"
        for line in structured_output["lines"]
    )

    try:
        extraction_result = run_extraction(document_id, extracted_text)
    except Exception:
        _repo.update_status(payload.session_id, document_id, DocumentStatus.FAILED)
        raise

    tasks = build_tasks(document_id, extraction_result["tasks"], extraction_result["provider"])
    tasks = localize_tasks(tasks)
    _task_repo.create_tasks(payload.session_id, tasks)

    _repo.update_status(payload.session_id, document_id, DocumentStatus.READY, tasks_generated=len(tasks))
    return _repo.get_document(payload.session_id, document_id)


@router.get("/{document_id}/preview-url")
def get_preview_url(document_id: str, session_id: str = Query(...)) -> dict:
    """Return a short-lived presigned S3 GET URL for the original uploaded file."""
    document = _repo.get_document(session_id, document_id)
    if document is None:
        raise NotFoundError(f"Document {document_id} not found")
    url = _s3.generate_presigned_get_url(document.s3_key)
    return {"preview_url": url, "filename": document.filename, "s3_key": document.s3_key}


@router.delete("/{document_id}")
def delete_document(document_id: str, session_id: str = Query(...)) -> Response:
    """Delete a document: removes S3 files (original + textract output) and the DynamoDB row."""
    document = _repo.get_document(session_id, document_id)
    if document is None:
        raise NotFoundError(f"Document {document_id} not found")

    # Delete S3 objects — best-effort; don't fail the whole delete if textract output is missing
    keys_to_delete = [document.s3_key]
    if document.textract_output_key:
        keys_to_delete.append(document.textract_output_key)
    # Also attempt the default textract output path in case it wasn't saved on the document
    default_textract_key = f"textract/{document_id}/output.json"
    if default_textract_key not in keys_to_delete:
        keys_to_delete.append(default_textract_key)

    _s3.delete_objects(keys_to_delete)

    # Remove DynamoDB row
    _repo.delete_document(session_id, document_id)

    return Response(status_code=204)