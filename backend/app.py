from flask import Flask, jsonify
from flask_cors import CORS

from routes.voicings import voicings_blueprint
from routes.progressions import progressions_blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(voicings_blueprint)
app.register_blueprint(progressions_blueprint)


@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "message": "Harmony Discovery Explorer backend is running!"
    })


if __name__ == "__main__":
    app.run(debug=True)
