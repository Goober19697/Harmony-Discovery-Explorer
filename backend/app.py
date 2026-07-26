import logging
import os
import re
import warnings

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import CONFIGURATIONS, environment_flag, environment_port
from database.db import check_database_connection
from routes.auth import auth_blueprint
from routes.progressions import progressions_blueprint
from routes.voicings import voicings_blueprint

load_dotenv()


class RedactingFormatter(logging.Formatter):
    SENSITIVE_VALUE = re.compile(
        r"(?i)\b(password|secret_key|session|cookie)(\s*[=:]\s*)([^\s,;]+)"
    )

    def format(self, record):
        rendered = super().format(record)
        return self.SENSITIVE_VALUE.sub(r"\1\2[REDACTED]", rendered)


def _configure_logging(app):
    level_name = app.config["LOG_LEVEL"]
    level = getattr(logging, level_name, None)
    if not isinstance(level, int):
        raise ValueError(f"LOG_LEVEL has invalid value: {level_name}")
    log_format = "%(asctime)s %(levelname)s %(name)s %(message)s"
    logging.basicConfig(
        level=level,
        format=log_format,
    )
    formatter = RedactingFormatter(log_format)
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)
    for handler in app.logger.handlers:
        handler.setFormatter(formatter)
    app.logger.setLevel(level)


def _validate_configuration(app):
    environment = app.config["APP_ENV"]
    if environment == "production" and not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY is required in production.")
    if environment == "production" and not app.config.get("FRONTEND_ORIGIN"):
        raise RuntimeError("FRONTEND_ORIGIN is required in production.")
    if environment == "production" and not app.config["SESSION_COOKIE_SECURE"]:
        raise RuntimeError("SESSION_COOKIE_SECURE must be true in production.")
    if not app.config.get("SECRET_KEY"):
        app.config["SECRET_KEY"] = "development-only-change-me"
        warnings.warn(
            "SECRET_KEY is not set; using an insecure development-only fallback.",
            RuntimeWarning,
        )
    if (
        app.config["SESSION_COOKIE_SAMESITE"] == "None"
        and not app.config["SESSION_COOKIE_SECURE"]
    ):
        raise ValueError("SameSite=None requires SESSION_COOKIE_SECURE=true.")
    if app.config.get("FRONTEND_ORIGIN") == "*":
        raise ValueError("FRONTEND_ORIGIN must be an exact origin, not '*'.")


def _register_error_handlers(app):
    messages = {
        400: "Bad request.",
        401: "Authentication required.",
        403: "Forbidden.",
        404: "Not found.",
        409: "Conflict.",
        500: "Internal server error.",
    }

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        if request.path.startswith("/api/"):
            message = messages.get(error.code, error.name)
            return jsonify({"error": message}), error.code
        return error

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unhandled exception while serving %s", request.path)
        if request.path.startswith("/api/"):
            return jsonify({"error": messages[500]}), 500
        return "Internal server error.", 500


def create_app(environment=None, test_config=None):
    selected_environment = (
        environment or os.getenv("APP_ENV", "development")
    ).strip().lower()
    config_class = CONFIGURATIONS.get(selected_environment)
    if config_class is None:
        raise ValueError(
            "APP_ENV must be development, testing, or production."
        )

    application = Flask(__name__)
    application.config.from_object(config_class)
    application.config.update(config_class.from_environment())
    if test_config:
        application.config.update(test_config)
    _validate_configuration(application)
    _configure_logging(application)

    CORS(
        application,
        resources={
            r"/api/*": {
                "origins": [application.config["FRONTEND_ORIGIN"]]
            }
        },
        supports_credentials=True,
    )
    application.register_blueprint(auth_blueprint)
    application.register_blueprint(voicings_blueprint)
    application.register_blueprint(progressions_blueprint)
    _register_error_handlers(application)

    @application.get("/api/health/live")
    def liveness():
        return jsonify({"status": "alive"}), 200

    @application.get("/api/health")
    def health():
        try:
            check_database_connection()
        except Exception:
            application.logger.exception("Database health check failed")
            return jsonify({
                "status": "unhealthy",
                "database": "unavailable",
            }), 503
        return jsonify({"status": "healthy", "database": "available"}), 200

    application.logger.info(
        "Application configured environment=%s host=%s port=%s frontend_origin=%s",
        application.config["APP_ENV"],
        application.config["API_HOST"],
        application.config["API_PORT"],
        application.config["FRONTEND_ORIGIN"],
    )
    return application


# Backward compatible for tests, `python app.py`, and `gunicorn app:app`.
app = create_app()


if __name__ == "__main__":
    app.run(
        host=app.config["API_HOST"],
        port=app.config["API_PORT"],
        debug=app.config["FLASK_DEBUG"],
    )
