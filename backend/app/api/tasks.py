"""
Task endpoints — Phase 9.

    GET   /tasks?session_id=&lang=en|hi|kn
    PATCH /tasks/{task_id}?session_id=
"""

from fastapi import APIRouter, Query

from app.core.exceptions import NotFoundError
from app.models.task import TaskUpdateRequest
from app.repositories.task_repository import TaskRepository
from app.services.task_service import apply_locale

router = APIRouter(prefix="/tasks", tags=["tasks"])
_repo = TaskRepository()


@router.get("")
def list_tasks(session_id: str = Query(...), lang: str = Query("en")) -> dict:
    tasks = _repo.list_tasks(session_id)
    return {"tasks": [apply_locale(task, lang) for task in tasks]}


@router.patch("/{task_id}")
def update_task(task_id: str, payload: TaskUpdateRequest, session_id: str = Query(...)) -> dict:
    task = _repo.get_task(session_id, task_id)
    if task is None:
        raise NotFoundError(f"Task {task_id} not found")

    _repo.update_task(session_id, task_id, payload.model_dump(mode="json", exclude_unset=True))
    return apply_locale(_repo.get_task(session_id, task_id), "en")