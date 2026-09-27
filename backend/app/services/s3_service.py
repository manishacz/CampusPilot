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

    def put_json(self, key: str, payload: dict) -> None:
        """Writes a JSON object to S3 — used for the Textract structured-output dump."""
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=json.dumps(payload, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
