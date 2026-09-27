"""
Shared exception types. Populated as each phase needs them.
"""


class CampusWorkflowError(Exception):
    """Base class for all application-raised errors."""


class AppError(Exception):
    """Base class for all app-raised (as opposed to unexpected) errors."""

    status_code = 500

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404


class ValidationError(AppError):
    status_code = 400


class InvalidModelOutput(AppError):
    """Raised when a model response fails schema validation and cannot be repaired. Phase 7."""

    status_code = 502


class ProcessingFailed(AppError):
    """Raised when both the primary and fallback extraction paths are exhausted. Phase 7."""

    status_code = 502
