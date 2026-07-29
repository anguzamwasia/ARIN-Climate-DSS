"""
Pytest configuration for the backend test suite.

Sets test-only environment variables *before* anything imports app.config or
app.main, since app.config.settings is a module-level singleton read once at
import time. Uses a throwaway file-based SQLite database instead of the real
Postgres DATABASE_URL so these tests run standalone, with no external
services required.
"""
import os
import tempfile

import pytest

_TEST_DB_FD, _TEST_DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(_TEST_DB_FD)

os.environ["ENVIRONMENT"] = "development"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-do-not-use-in-production"
os.environ["ALLOWED_EMAILS"] = "admin@arin-africa.org,contributor@example.com"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["RUN_SCHEDULER"] = "false"
os.environ.setdefault("OPENAI_API_KEY", "")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin_token(client):
    client.post("/api/v1/auth/signup", json={
        "name": "Admin",
        "email": "admin@arin-africa.org",
        "password": "test-password-123",
    })
    res = client.post("/api/v1/auth/login", data={
        "username": "admin@arin-africa.org",
        "password": "test-password-123",
    })
    return res.json()["access_token"]


@pytest.fixture()
def user_token(client):
    client.post("/api/v1/auth/signup", json={
        "name": "Contributor",
        "email": "contributor@example.com",
        "password": "test-password-123",
    })
    res = client.post("/api/v1/auth/login", data={
        "username": "contributor@example.com",
        "password": "test-password-123",
    })
    return res.json()["access_token"]
