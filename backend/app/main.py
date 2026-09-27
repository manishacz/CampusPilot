"""
Campus Workflow AI — backend entrypoint.

Phase 4 adds the AppError -> HTTP status exception handler so
NotFoundError/ValidationError raised in api/documents.py return proper
404/400 responses instead of a generic 500.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import documents, health, tasks
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import get_logger

logger = get_logger("campus_workflow_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting Campus Workflow AI backend")
    logger.info("Allowed CORS origins: %s", settings.cors_origins_list)
    yield
    logger.info("Shutting down Campus Workflow AI backend")


app = FastAPI(title="Campus Workflow AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
def handle_app_error(_request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(health.router)
app.include_router(documents.router)
app.include_router(tasks.router)
