"""
S3 presigned-URL generation (Phase 4) + JSON object writes (Phase 5).

The backend never touches the *uploaded* file's bytes (the browser PUTs
directly to S3), but Phase 5 does write the Textract structured-output
JSON back to S3 itself — that's a normal server-side put_object, not a
presigned flow.
"""

import json
import uuid

import boto3

from app.core.config import get_settings


class S3Service:
    def __init__(self):
        settings = get_settings()
        self._bucket = settings.s3_bucket
        self._client = boto3.client("s3", region_name=settings.aws_region)

    @staticmethod
    def generate_document_id() -> str:
        return f"doc-{uuid.uuid4()}"

    @staticmethod
    def build_s3_key(document_id: str, filename: str) -> str:
        # documents/{document_id}/original.<ext> — the S3 layout frozen in Phase 3.
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        return f"documents/{document_id}/original.{ext}"

    def generate_presigned_put_url(self, s3_key: str, content_type: str, expires_in: int = 900) -> str:
        return self._client.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": self._bucket, "Key": s3_key, "ContentType": content_type},
            ExpiresIn=expires_in,
        )

    def generate_presigned_get_url(self, s3_key: str, expires_in: int = 900) -> str:
        """Generate a presigned GET URL so a browser can read an S3 object (15 min default)."""
        return self._client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self._bucket, "Key": s3_key},
            ExpiresIn=expires_in,
        )

    def put_json(self, key: str, payload: dict) -> None:
        """Writes a JSON object to S3 — used for the Textract structured-output dump."""
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=json.dumps(payload, indent=2).encode("utf-8"),
            ContentType="application/json",
        )

    def get_object_bytes(self, key: str) -> bytes:
        """Downloads an S3 object and returns its raw bytes.

        Used by the Office extractor to read docx/xlsx/pptx files directly
        (the browser PUT them via presigned URL; the backend reads them here).
        """
        response = self._client.get_object(Bucket=self._bucket, Key=key)
        return response["Body"].read()

    def delete_objects(self, keys: list[str]) -> None:
        """Delete one or more S3 objects in a single API call (best-effort).

        S3's delete_objects is idempotent — missing keys are silently ignored.
        This is intentional: the textract output may never have been written
        if extraction failed early.
        """
        if not keys:
            return
        self._client.delete_objects(
            Bucket=self._bucket,
            Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
        )


