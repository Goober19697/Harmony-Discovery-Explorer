from flask import Blueprint, g, jsonify, request

from services.auth_guard import login_required
from services.progression_service import (
    create_progression,
    list_progressions,
    remove_progression,
    update_progression,
)

progressions_blueprint = Blueprint("progressions", __name__)


@progressions_blueprint.route("/api/progressions", methods=["GET"])
@login_required
def get_progressions():
    try:
        progressions = list_progressions(g.user_id)
    except Exception as error:
        print(f"Failed to load progressions: {error}")
        return jsonify({"error": "Unable to load progressions"}), 500

    return jsonify({"progressions": progressions}), 200


@progressions_blueprint.route("/api/progressions/<int:progression_id>", methods=["PATCH"])
@login_required
def patch_progression(progression_id):
    data = request.get_json(silent=True)

    try:
        updated_progression = update_progression(g.user_id, progression_id, data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to update progression: {error}")
        return jsonify({"error": "Unable to update progression"}), 500

    if updated_progression is None:
        return jsonify({"error": "Progression not found"}), 404

    return jsonify({
        "message": "Progression updated",
        "progression": updated_progression,
    }), 200


@progressions_blueprint.route("/api/progressions/<int:progression_id>", methods=["DELETE"])
@login_required
def delete_progression(progression_id):
    try:
        deleted = remove_progression(g.user_id, progression_id)
    except Exception as error:
        print(f"Failed to delete progression: {error}")
        return jsonify({"error": "Unable to delete progression"}), 500

    if not deleted:
        return jsonify({"error": "Progression not found"}), 404
    return jsonify({"message": "Progression deleted"}), 200


@progressions_blueprint.route("/api/progressions", methods=["POST"])
@login_required
def save_progression():
    data = request.get_json(silent=True)

    try:
        saved_progression = create_progression(g.user_id, data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to save progression: {error}")
        return jsonify({"error": "Unable to save progression"}), 500

    return jsonify({
        "message": "Progression saved",
        "progression": saved_progression,
    }), 201
