import os
import warnings

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth import auth_blueprint
from routes.voicings import voicings_blueprint
from routes.progressions import progressions_blueprint

load_dotenv()


def environment_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def environment_port(name, default):
    value = os.getenv(name, str(default))
    try:
        port = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must be an integer port number.") from error
    if not 1 <= port <= 65535:
        raise ValueError(f"{name} must be between 1 and 65535.")
    return port


app = Flask(__name__)
secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    secret_key = "development-only-change-me"
    warnings.warn(
        "SECRET_KEY is not set; using an insecure development-only fallback.",
        RuntimeWarning,
    )

app.config.update(
    SECRET_KEY=secret_key,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=environment_flag("SESSION_COOKIE_SECURE"),
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(
    app,
    resources={r"/api/*": {"origins": [frontend_origin]}},
    supports_credentials=True,
)

app.register_blueprint(auth_blueprint)
app.register_blueprint(voicings_blueprint)
app.register_blueprint(progressions_blueprint)


@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "message": "Harmony Discovery Explorer backend is running!"
    })


if __name__ == "__main__":
    app.run(
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=environment_port("API_PORT", 5001),
        debug=environment_flag("FLASK_DEBUG", default=True),
    )
