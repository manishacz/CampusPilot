"""
DynamoDB single-table access for DOC# items — Phase 4.

PK: SESSION#<session_id>   SK: DOC#<document_id>
(matches the table created in Phase 3's infrastructure/template.yaml)
"""

import boto3
from boto3.dynamodb.conditions import Key

from app.core.config import get_settings
from app.models.document import Document, DocumentStatus


class DocumentRepository:
    def __init__(self):
        settings = get_settings()
        self._table = boto3.resource("dynamodb", region_name=settings.aws_region).Table(
            settings.dynamodb_table
        )

    @staticmethod
    def _pk(session_id: str) -> str:
        return f"SESSION#{session_id}"

    @staticmethod
    def _sk(document_id: str) -> str:
        return f"DOC#{document_id}"

    def create_document(self, session_id: str, document: Document) -> None:
        item = document.model_dump(mode="json")
        item["PK"] = self._pk(session_id)
        item["SK"] = self._sk(document.document_id)
        self._table.put_item(Item=item)

    def get_document(self, session_id: str, document_id: str) -> Document | None:
        response = self._table.get_item(Key={"PK": self._pk(session_id), "SK": self._sk(document_id)})
        item = response.get("Item")
        return self._to_document(item) if item else None

    def list_documents(self, session_id: str) -> list[Document]:
        response = self._table.query(
            KeyConditionExpression=Key("PK").eq(self._pk(session_id)) & Key("SK").begins_with("DOC#")
        )
        return [self._to_document(item) for item in response.get("Items", [])]

    def update_status(self, session_id: str, document_id: str, status: DocumentStatus, **extra) -> None:
        expr_names = {"#status": "status"}
        expr_values = {":status": status.value}
        set_clauses = ["#status = :status"]
        for key, value in extra.items():
            expr_names[f"#{key}"] = key
            expr_values[f":{key}"] = value
            set_clauses.append(f"#{key} = :{key}")
        self._table.update_item(
            Key={"PK": self._pk(session_id), "SK": self._sk(document_id)},
            UpdateExpression="SET " + ", ".join(set_clauses),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )

    @staticmethod
    def _to_document(item: dict) -> Document:
        clean = {k: v for k, v in item.items() if k not in ("PK", "SK")}
        return Document(**clean)
