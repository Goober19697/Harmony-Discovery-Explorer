import unittest
from unittest.mock import patch

from werkzeug.security import check_password_hash, generate_password_hash

from app import app
from services.auth_service import DuplicateEmailError, create_user, public_user


def stored_user(user_id=1, email="user@example.com", password="correct password"):
    return {
        "id": user_id,
        "email": email,
        "password_hash": generate_password_hash(password),
        "display_name": "Harmony User",
        "created_at": "2026-07-25T12:00:00+00:00",
    }


class AuthServiceTests(unittest.TestCase):
    @patch("services.auth_service.insert_user")
    def test_create_user_normalizes_email_and_hashes_password(self, insert_user):
        insert_user.side_effect = lambda **values: {
            "id": 1,
            "created_at": "2026-07-25T12:00:00+00:00",
            **values,
        }

        user = create_user({
            "email": "  USER@Example.COM ",
            "password": "secure password",
            "display_name": "  Harmony User  ",
        })

        self.assertEqual(user["email"], "user@example.com")
        self.assertNotEqual(user["password_hash"], "secure password")
        self.assertTrue(check_password_hash(user["password_hash"], "secure password"))
        self.assertEqual(user["display_name"], "Harmony User")

    def test_public_user_never_returns_password_hash(self):
        result = public_user(stored_user())
        self.assertNotIn("password_hash", result)


class AuthRouteTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="test-secret")
        self.client = app.test_client()

    @patch("routes.auth.create_user")
    def test_registration_succeeds_and_logs_user_in(self, create_user_mock):
        user = stored_user()
        create_user_mock.return_value = user

        response = self.client.post("/api/auth/register", json={
            "email": user["email"],
            "password": "correct password",
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["user"]["email"], user["email"])
        self.assertNotIn("password_hash", response.get_json()["user"])
        with self.client.session_transaction() as session:
            self.assertEqual(session["user_id"], user["id"])

    @patch("routes.auth.create_user")
    def test_duplicate_registration_returns_409(self, create_user_mock):
        create_user_mock.side_effect = DuplicateEmailError(
            "An account with that email already exists."
        )
        response = self.client.post("/api/auth/register", json={
            "email": "user@example.com",
            "password": "correct password",
        })
        self.assertEqual(response.status_code, 409)

    @patch("routes.auth.authenticate_user")
    def test_login_succeeds_with_correct_password(self, authenticate_user_mock):
        user = stored_user()
        authenticate_user_mock.return_value = user
        response = self.client.post("/api/auth/login", json={
            "email": user["email"],
            "password": "correct password",
        })
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("password_hash", response.get_json()["user"])
        with self.client.session_transaction() as session:
            self.assertEqual(session["user_id"], user["id"])

    @patch("routes.auth.authenticate_user", return_value=None)
    def test_login_fails_with_incorrect_password(self, _authenticate_user):
        response = self.client.post("/api/auth/login", json={
            "email": "user@example.com",
            "password": "incorrect password",
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "Invalid email or password.")

    @patch("routes.auth.find_user_by_id")
    def test_me_returns_authenticated_user(self, find_user_mock):
        user = stored_user()
        find_user_mock.return_value = user
        with self.client.session_transaction() as session:
            session["user_id"] = user["id"]

        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["id"], user["id"])
        self.assertNotIn("password_hash", response.get_json()["user"])

    def test_me_returns_401_without_session(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_logout_clears_authentication(self):
        with self.client.session_transaction() as session:
            session["user_id"] = 1

        response = self.client.post("/api/auth/logout")

        self.assertEqual(response.status_code, 200)
        with self.client.session_transaction() as session:
            self.assertNotIn("user_id", session)


if __name__ == "__main__":
    unittest.main()
