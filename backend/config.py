import os


def environment_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value.")


def environment_port(name, default):
    value = os.getenv(name, str(default))
    try:
        port = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must be an integer port number.") from error
    if not 1 <= port <= 65535:
        raise ValueError(f"{name} must be between 1 and 65535.")
    return port


def _same_site():
    value = os.getenv("SESSION_COOKIE_SAMESITE", "Lax").strip().capitalize()
    if value not in {"Lax", "Strict", "None"}:
        raise ValueError("SESSION_COOKIE_SAMESITE must be Lax, Strict, or None.")
    return value


class BaseConfig:
    APP_ENV = "development"
    SECRET_KEY = None
    FRONTEND_ORIGIN = "http://localhost:5173"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = "Lax"
    API_HOST = "127.0.0.1"
    API_PORT = 5001
    FLASK_DEBUG = False
    LOG_LEVEL = "INFO"

    @classmethod
    def from_environment(cls):
        frontend_origin = os.getenv("FRONTEND_ORIGIN", cls.FRONTEND_ORIGIN)
        return {
            "SECRET_KEY": os.getenv("SECRET_KEY"),
            "FRONTEND_ORIGIN": (
                frontend_origin.rstrip("/") if frontend_origin else None
            ),
            "SESSION_COOKIE_HTTPONLY": True,
            "SESSION_COOKIE_SECURE": environment_flag(
                "SESSION_COOKIE_SECURE", cls.SESSION_COOKIE_SECURE
            ),
            "SESSION_COOKIE_SAMESITE": _same_site(),
            "API_HOST": os.getenv("API_HOST", cls.API_HOST),
            "API_PORT": environment_port("API_PORT", cls.API_PORT),
            "FLASK_DEBUG": environment_flag("FLASK_DEBUG", cls.FLASK_DEBUG),
            "LOG_LEVEL": os.getenv("LOG_LEVEL", cls.LOG_LEVEL).upper(),
        }


class DevelopmentConfig(BaseConfig):
    FLASK_DEBUG = True


class TestingConfig(BaseConfig):
    APP_ENV = "testing"
    TESTING = True
    SECRET_KEY = "testing-only-secret"


class ProductionConfig(BaseConfig):
    APP_ENV = "production"
    API_HOST = "0.0.0.0"
    FRONTEND_ORIGIN = None
    SESSION_COOKIE_SECURE = True


CONFIGURATIONS = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
