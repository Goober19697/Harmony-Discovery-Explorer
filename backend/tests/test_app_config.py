import os
import unittest
from unittest.mock import patch

from app import create_app, environment_port


class AppConfigurationTests(unittest.TestCase):
    def test_api_port_uses_integer_environment_value(self):
        with patch.dict(os.environ, {"API_PORT": "5001"}):
            self.assertEqual(environment_port("API_PORT", 5001), 5001)

    def test_api_port_rejects_invalid_or_out_of_range_values(self):
        for value in ("not-a-port", "0", "65536"):
            with self.subTest(value=value), patch.dict(
                os.environ, {"API_PORT": value}
            ):
                with self.assertRaisesRegex(ValueError, "API_PORT"):
                    environment_port("API_PORT", 5001)

    def test_production_requires_secret_key(self):
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "SECRET_KEY": "",
                "SESSION_COOKIE_SECURE": "true",
            },
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "SECRET_KEY"):
                create_app()

    def test_production_cookie_settings_are_secure(self):
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "SECRET_KEY": "production-test-secret",
                "FRONTEND_ORIGIN": "https://harmony.example",
            },
            clear=True,
        ):
            application = create_app()
        self.assertTrue(application.config["SESSION_COOKIE_HTTPONLY"])
        self.assertTrue(application.config["SESSION_COOKIE_SECURE"])
        self.assertEqual(application.config["SESSION_COOKIE_SAMESITE"], "Lax")

    def test_production_allows_temporary_http_cookie_configuration(self):
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "SECRET_KEY": "production-test-secret",
                "FRONTEND_ORIGIN": "http://3.93.162.237",
                "SESSION_COOKIE_SECURE": "false",
                "SESSION_COOKIE_SAMESITE": "Lax",
            },
            clear=True,
        ), self.assertWarnsRegex(RuntimeWarning, "temporary HTTP deployment"):
            application = create_app()
        self.assertTrue(application.config["SESSION_COOKIE_HTTPONLY"])
        self.assertFalse(application.config["SESSION_COOKIE_SECURE"])
        self.assertEqual(application.config["SESSION_COOKIE_SAMESITE"], "Lax")


class HealthAndErrorTests(unittest.TestCase):
    def setUp(self):
        self.application = create_app("testing", {"SECRET_KEY": "test-secret"})
        self.client = self.application.test_client()

    @patch("app.check_database_connection", return_value=True)
    def test_health_succeeds_when_database_is_available(self, _check_database):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["database"], "available")

    @patch("app.check_database_connection", side_effect=RuntimeError("db-password"))
    def test_health_returns_safe_503_when_database_fails(self, _check_database):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        body = response.get_data(as_text=True)
        self.assertEqual(response.content_type, "application/json")
        self.assertNotIn("db-password", body)

    def test_api_http_errors_are_json(self):
        response = self.client.get("/api/does-not-exist")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.content_type, "application/json")
        self.assertEqual(response.get_json(), {"error": "Not found."})

    def test_unexpected_api_errors_do_not_leak_secrets(self):
        @self.application.get("/api/test-error")
        def test_error():
            raise RuntimeError("password=hunter2 session=secret-cookie")

        response = self.client.get("/api/test-error")
        self.assertEqual(response.status_code, 500)
        body = response.get_data(as_text=True)
        self.assertNotIn("hunter2", body)
        self.assertNotIn("secret-cookie", body)


if __name__ == "__main__":
    unittest.main()
