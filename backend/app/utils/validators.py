"""
Upload validation — Phase 4.

Runs at request time, before the presigned URL is even generated. The
backend never sees the file's bytes (the browser PUTs straight to S3), so
this only guards the filename/extension — matching the PRD's allowed
input types (PDF, PNG, JPG/JPEG, TIFF).
"""

from app.core.exceptions import ValidationError

_ALLOWED_EXTENSIONS = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "tif": "image/tiff",
    "tiff": "image/tiff",
}


def validate_filename(filename: str) -> str:
    """Returns the content type to use for the presigned URL, or raises ValidationError."""
    if not filename or "." not in filename:
        raise ValidationError("Filename must include an extension (e.g. notice.pdf)")

    ext = filename.rsplit(".", 1)[-1].lower()
    content_type = _ALLOWED_EXTENSIONS.get(ext)
    if content_type is None:
        allowed = ", ".join(sorted(set(_ALLOWED_EXTENSIONS.keys())))
        raise ValidationError(f"Unsupported file type '.{ext}'. Allowed: {allowed}")

    return content_type
