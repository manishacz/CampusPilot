"""
Amazon Textract OCR — Phase 5.

S3 object -> start_document_analysis(FeatureTypes=["TABLES", "FORMS"])
-> poll get_document_analysis until SUCCEEDED
-> parse LINE text + KEY_VALUE_SET pairs + per-block bounding-box geometry
-> write structured output to s3://<bucket>/textract/{document_id}/output.json

Polling (not SNS/SQS) is intentional — fine at hackathon scale per the
Phase 5 spec. Keeps raw bounding-box geometry per block; that's what
source_bbox in the task schema passes through, and what SourceViewer.jsx /
ConfidenceIndicator.jsx render on the frontend later.
"""

import time

import boto3

from app.core.config import get_settings
from app.core.exceptions import AppError


class TextractTimeoutError(AppError):
    status_code = 504


class TextractJobFailedError(AppError):
    status_code = 502


class TextractService:
    def __init__(self):
        settings = get_settings()
        self._bucket = settings.s3_bucket
        self._client = boto3.client("textract", region_name=settings.aws_region)

    def start_analysis(self, s3_key: str) -> str:
        """Kicks off async Textract analysis for an object already in our bucket. Returns JobId."""
        response = self._client.start_document_analysis(
            DocumentLocation={"S3Object": {"Bucket": self._bucket, "Name": s3_key}},
            FeatureTypes=["TABLES", "FORMS"],
        )
        return response["JobId"]

    def wait_for_completion(
        self, job_id: str, poll_interval_seconds: float = 2.0, timeout_seconds: float = 300.0
    ) -> None:
        """Blocks until the job reaches SUCCEEDED, or raises on FAILED/timeout."""
        elapsed = 0.0
        while elapsed < timeout_seconds:
            response = self._client.get_document_analysis(JobId=job_id, MaxResults=1)
            status = response["JobStatus"]
            if status == "SUCCEEDED":
                return
            if status == "FAILED":
                reason = response.get("StatusMessage", "unknown reason")
                raise TextractJobFailedError(f"Textract job {job_id} failed: {reason}")
            # IN_PROGRESS or PARTIAL_SUCCESS -> keep polling
            time.sleep(poll_interval_seconds)
            elapsed += poll_interval_seconds
        raise TextractTimeoutError(f"Textract job {job_id} did not complete within {timeout_seconds}s")

    def fetch_all_blocks(self, job_id: str) -> list[dict]:
        """Paginates get_document_analysis to collect every Block across all result pages."""
        blocks: list[dict] = []
        next_token: str | None = None
        while True:
            kwargs = {"JobId": job_id, "MaxResults": 1000}
            if next_token:
                kwargs["NextToken"] = next_token
            response = self._client.get_document_analysis(**kwargs)
            blocks.extend(response.get("Blocks", []))
            next_token = response.get("NextToken")
            if not next_token:
                break
        return blocks

    @staticmethod
    def extract_structured_output(blocks: list[dict]) -> dict:
        """
        Turns raw Textract Blocks into the structured shape Phase 6 (Bedrock)
        consumes and Phase 8+ (SourceViewer) renders: page text lines with
        geometry, plus resolved key-value form pairs.
        """
        block_by_id = {block["Id"]: block for block in blocks}

        lines: list[dict] = []
        for block in blocks:
            if block["BlockType"] != "LINE":
                continue
            geometry = block.get("Geometry", {}).get("BoundingBox", {})
            lines.append(
                {
                    "page": block.get("Page", 1),
                    "text": block.get("Text", ""),
                    "confidence": block.get("Confidence"),
                    "bbox": [
                        geometry.get("Left"),
                        geometry.get("Top"),
                        geometry.get("Width"),
                        geometry.get("Height"),
                    ],
                }
            )

        def _resolve_text(block: dict) -> str:
            """Follows CHILD relationships down to WORD blocks to build the text of a KEY or VALUE block."""
            words = []
            for rel in block.get("Relationships", []):
                if rel["Type"] != "CHILD":
                    continue
                for child_id in rel["Ids"]:
                    child = block_by_id.get(child_id)
                    if child and child["BlockType"] == "WORD":
                        words.append(child.get("Text", ""))
            return " ".join(words)

        key_value_pairs: list[dict] = []
        for block in blocks:
            if block["BlockType"] != "KEY_VALUE_SET" or "KEY" not in block.get("EntityTypes", []):
                continue
            key_text = _resolve_text(block)
            value_text = ""
            for rel in block.get("Relationships", []):
                if rel["Type"] != "VALUE":
                    continue
                for value_id in rel["Ids"]:
                    value_block = block_by_id.get(value_id)
                    if value_block:
                        value_text = _resolve_text(value_block)
            if key_text:
                key_value_pairs.append({"key": key_text, "value": value_text})

        page_count = max((block.get("Page", 1) for block in blocks), default=1)

        return {
            "page_count": page_count,
            "lines": lines,
            "key_value_pairs": key_value_pairs,
        }

    def run(self, document_id: str, s3_key: str) -> dict:
        """Full Phase 5 pipeline for one document. Returns the structured output dict."""
        job_id = self.start_analysis(s3_key)
        self.wait_for_completion(job_id)
        blocks = self.fetch_all_blocks(job_id)
        return self.extract_structured_output(blocks)
