"""
Office document text extraction — covers all non-Textract file formats.

Amazon Textract only supports PDF and images (PNG, JPG, TIFF). For Office
formats (docx, doc, xlsx, xls, pptx, ppt) we download the file from S3
directly and extract text with native Python libraries:
  - python-docx  → .docx / .doc
  - openpyxl     → .xlsx / .xls
  - python-pptx  → .pptx / .ppt

The output dict intentionally mirrors the shape returned by
TextractService.extract_structured_output() so that documents.py can
treat both paths identically downstream (AI extraction, DynamoDB writes).
"""

import io

from app.core.exceptions import AppError

# --- extension sets --------------------------------------------------------

OFFICE_EXTENSIONS = {"docx", "doc", "xlsx", "xls", "pptx", "ppt"}


def is_office_file(s3_key: str) -> bool:
    """Returns True if the S3 key points to an Office document."""
    ext = s3_key.rsplit(".", 1)[-1].lower() if "." in s3_key else ""
    return ext in OFFICE_EXTENSIONS


# --- per-format extractors -------------------------------------------------

def _extract_docx(data: bytes) -> list[str]:
    """Extract paragraph text from a .docx (or .doc saved as .docx)."""
    try:
        from docx import Document  # python-docx
    except ImportError as exc:
        raise AppError("python-docx is not installed") from exc

    doc = Document(io.BytesIO(data))
    paragraphs: list[str] = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)

    # Also pull text from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs.append(row_text)

    return paragraphs


def _extract_xlsx(data: bytes) -> list[str]:
    """Extract cell values from all sheets of an .xlsx workbook."""
    try:
        import openpyxl  # openpyxl
    except ImportError as exc:
        raise AppError("openpyxl is not installed") from exc

    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    lines: list[str] = []
    for sheet in wb.worksheets:
        lines.append(f"Sheet: {sheet.title}")
        for row in sheet.iter_rows(values_only=True):
            row_text = " | ".join(str(cell) for cell in row if cell is not None and str(cell).strip())
            if row_text:
                lines.append(row_text)
    wb.close()
    return lines


def _extract_pptx(data: bytes) -> list[str]:
    """Extract text from all slides and shapes in a .pptx presentation."""
    try:
        from pptx import Presentation  # python-pptx
    except ImportError as exc:
        raise AppError("python-pptx is not installed") from exc

    prs = Presentation(io.BytesIO(data))
    lines: list[str] = []
    for slide_num, slide in enumerate(prs.slides, start=1):
        lines.append(f"Slide {slide_num}")
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                lines.append(shape.text.strip())
    return lines


# --- public API ------------------------------------------------------------

def extract_text_from_office(s3_key: str, file_bytes: bytes) -> dict:
    """
    Extract text from an Office document and return a structured-output dict
    that is shape-compatible with TextractService.extract_structured_output().

    Returns:
        {
            "page_count": int,
            "lines": [{"page": 1, "text": str, "confidence": None, "bbox": None}],
            "key_value_pairs": [],
        }
    """
    ext = s3_key.rsplit(".", 1)[-1].lower() if "." in s3_key else ""

    if ext in ("docx", "doc"):
        raw_lines = _extract_docx(file_bytes)
    elif ext in ("xlsx", "xls"):
        raw_lines = _extract_xlsx(file_bytes)
    elif ext in ("pptx", "ppt"):
        raw_lines = _extract_pptx(file_bytes)
    else:
        raise AppError(f"Office extractor does not support '.{ext}' files")

    if not raw_lines:
        raise AppError(
            f"No text could be extracted from the document ('{ext}'). "
            "The file may be empty, password-protected, or corrupt."
        )

    structured_lines = [
        {"page": 1, "text": line, "confidence": None, "bbox": None}
        for line in raw_lines
    ]

    return {
        "page_count": 1,          # Office docs don't report page count via these libs
        "lines": structured_lines,
        "key_value_pairs": [],
    }
