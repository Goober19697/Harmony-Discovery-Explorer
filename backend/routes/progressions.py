from flask import Blueprint, jsonify, request

from services.progression_service import create_progression

progressions_blueprint = Blueprint("progressions", __name__)


@progressions_blueprint.route("/api/progressions", methods=["POST"])
def save_progression():
    data = request.get_json(silent=True)

    try:
        saved_progression = create_progression(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to save progression: {error}")
        return jsonify({"error": "Unable to save progression"}), 500

    return jsonify({
        "message": "Progression saved",
        "progression": saved_progression,
    }), 201
