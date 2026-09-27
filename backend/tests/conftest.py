"""
Shared pytest fixtures.

`client` gives every test a fresh TestClient against the real app (routers,
CORS middleware, lifespan included) rather than each test file constructing
its own — this is the "testable" half of Phase 2's objective.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
