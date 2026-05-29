# =============================================================
# tests/test_auth_register.py
# It tests the behaviors in POST /api/auth/register code: 
# SFSU email validation, duplicate email, insert success, 
# and Pydantic missing-field validation.
#
# Author: Binrong Zhu
# =============================================================

import pytest
import jwt
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import auth


class FakeCursor:
    def __init__(self, existing_user=False):
        self.existing_user = existing_user
        self.lastrowid = 1
        self.queries = []

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchone(self):
        if self.existing_user:
            return {"user_id": 99}
        return None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        pass


class FakeConnection:
    def __init__(self, existing_user=False):
        self.cursor_obj = FakeCursor(existing_user)
        self.committed = False
        self.closed = False

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(auth.router)
    return TestClient(app)


# --- Round 1: Core Tests ---

def test_valid_registration(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=False)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "student@sfsu.edu",
            "display_name": "Test Student",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["user_id"] == 1
    assert data["user"]["sfsu_email"] == "student@sfsu.edu"
    assert data["user"]["display_name"] == "Test Student"
    assert fake_conn.committed is True
    assert fake_conn.closed is True


def test_non_sfsu_email_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "student@gmail.com",
            "display_name": "Test Student",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Must use SFSU email"


def test_duplicate_email_rejected(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=True)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "student@sfsu.edu",
            "display_name": "Test Student",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"
    assert fake_conn.closed is True


@pytest.mark.parametrize(
    "payload, missing_field",
    [
        ({"display_name": "Test Student", "password": "password123"}, "sfsu_email"),
        ({"sfsu_email": "student@sfsu.edu", "password": "password123"}, "display_name"),
        ({"sfsu_email": "student@sfsu.edu", "display_name": "Test Student"}, "password"),
    ]
)
def test_missing_required_fields(client, payload, missing_field):
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    error_fields = [error["loc"][-1] for error in response.json()["detail"]]
    assert missing_field in error_fields


# --- Round 2: Edge Cases & Security ---

def test_sql_injection_attempt_in_email_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "student@sfsu.edu'; DROP TABLE users; --",
            "display_name": "Hacker",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Must use SFSU email"


def test_unicode_display_name_allowed(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=False)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "unicode@sfsu.edu",
            "display_name": "Aligator 🐊",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    assert response.json()["user"]["display_name"] == "Aligator 🐊"


def test_uppercase_sfsu_email_rejected_due_to_case_sensitivity(client):
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "USER@SFSU.EDU",
            "display_name": "Upper Case",
            "password": "password123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Must use SFSU email"


def test_special_characters_in_password_allowed(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=False)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "special@sfsu.edu",
            "display_name": "Special Password",
            "password": "P@$$w0rd!"
        }
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- Round 3: Improved password leakage test ---

def test_plain_password_never_appears_in_response(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=False)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    plain_password = "P@$$w0rd!"
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "secure@sfsu.edu",
            "display_name": "Secure User",
            "password": plain_password
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"success", "token", "user"}
    assert set(data["user"].keys()) == {"user_id", "sfsu_email", "display_name"}
    assert data["token"] != plain_password
    assert plain_password not in data["user"].values()
    assert "password" not in data
    assert "password_hash" not in data
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_returned_jwt_has_three_segments_and_exp_claim(client, monkeypatch):
    fake_conn = FakeConnection(existing_user=False)
    monkeypatch.setattr(auth, "get_connection", lambda: fake_conn)
    response = client.post(
        "/api/auth/register",
        json={
            "sfsu_email": "jwtuser@sfsu.edu",
            "display_name": "JWT User",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    token = response.json()["token"]
    assert len(token.split(".")) == 3
    decoded = jwt.decode(token, auth.SECRET_KEY, algorithms=["HS256"])
    assert "exp" in decoded
    assert decoded["email"] == "jwtuser@sfsu.edu"
    assert decoded["user_id"] == 1
    