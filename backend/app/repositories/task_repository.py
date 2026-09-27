"""
DynamoDB single-table access for TASK# items — Phase 8/9 full normalization
still to come; this persists whatever the extraction router returns.

PK: SESSION#<session_id>   SK: TASK#<task_id>
"""

import json
import uuid
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

from app.core.config import get_settings
from app.models.task import Task


class TaskRepository:
    def __init__(self):
        settings = get_settings()
        self._table = boto3.resource("dynamodb", region_name=settings.aws_region).Table(
            settings.dynamodb_table
        )

    @staticmethod
    def _pk(session_id: str) -> str:
        return f"SESSION#{session_id}"

    @staticmethod
    def _sk(task_id: str) -> str:
        return f"TASK#{task_id}"

    def create_tasks(self, session_id: str, tasks: list[Task]) -> None:
        with self._table.batch_writer() as batch:
            for task in tasks:
                # DynamoDB's boto3 serializer rejects native Python float (source_bbox
                # is a list of floats) — it requires Decimal. Round-tripping through
                # json.loads(..., parse_float=Decimal) converts every float in the
                # nested structure without writing a manual recursive walker.
                item = json.loads(task.model_dump_json(), parse_float=Decimal)
                item["PK"] = self._pk(session_id)
                item["SK"] = self._sk(task.task_id)
                batch.put_item(Item=item)

    def list_tasks(self, session_id: str) -> list[Task]:
        response = self._table.query(
            KeyConditionExpression=Key("PK").eq(self._pk(session_id)) & Key("SK").begins_with("TASK#")
        )
        return [self._to_task(item) for item in response.get("Items", [])]

    @staticmethod
    def _to_task(item: dict) -> Task:
        clean = {k: v for k, v in item.items() if k not in ("PK", "SK")}
        return Task(**clean)

    @staticmethod
    def new_task_id() -> str:
        return f"task-{uuid.uuid4()}"

    def get_task(self, session_id: str, task_id: str) -> Task | None:
        response = self._table.get_item(Key={"PK": self._pk(session_id), "SK": self._sk(task_id)})
        item = response.get("Item")
        return self._to_task(item) if item else None

    def update_task(self, session_id: str, task_id: str, updates: dict) -> None:
        if not updates:
            return
        expr_names, expr_values, set_clauses = {}, {}, []
        for key, value in updates.items():
            expr_names[f"#{key}"] = key
            expr_values[f":{key}"] = value
            set_clauses.append(f"#{key} = :{key}")
        self._table.update_item(
            Key={"PK": self._pk(session_id), "SK": self._sk(task_id)},
            UpdateExpression="SET " + ", ".join(set_clauses),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
