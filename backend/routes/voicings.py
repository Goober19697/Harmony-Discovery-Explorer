from flask import Blueprint, g, jsonify, request

from services.auth_guard import login_required
from services.voicing_service import (
    create_voicing,
    list_voicings,
    remove_voicing,
    update_voicing,
)

voicings_blueprint = Blueprint("voicings", __name__)


@voicings_blueprint.route("/api/voicings", methods=["GET"])
@login_required
def get_voicings():
    try:
        voicings = list_voicings(g.user_id)
    except Exception as error:
        print(f"Failed to load voicings: {error}")
        return jsonify({"error": "Unable to load voicings"}), 500

    return jsonify({"voicings": voicings}), 200


@voicings_blueprint.route("/api/voicings/<int:voicing_id>", methods=["DELETE"])
@login_required
def delete_voicing(voicing_id):
    try:
        deleted = remove_voicing(g.user_id, voicing_id)
    except Exception as error:
        print(f"Failed to delete voicing: {error}")
        return jsonify({"error": "Unable to delete voicing"}), 500

    if not deleted:
        return jsonify({"error": "Voicing not found"}), 404
    return jsonify({"message": "Voicing deleted"}), 200


@voicings_blueprint.route("/api/voicings/<int:voicing_id>", methods=["PATCH"])
@login_required
def patch_voicing(voicing_id):
    data = request.get_json(silent=True)
    try:
        updated_voicing = update_voicing(g.user_id, voicing_id, data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to update voicing: {error}")
        return jsonify({"error": "Unable to update voicing"}), 500

    if updated_voicing is None:
        return jsonify({"error": "Voicing not found"}), 404
    return jsonify({
        "message": "Voicing updated",
        "voicing": updated_voicing,
    }), 200


@voicings_blueprint.route("/api/voicings", methods=["POST"])
@login_required
def save_voicing():
    data = request.get_json(silent=True) or {}

    try:
        saved_voicing = create_voicing(g.user_id, data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to save voicing: {error}")
        return jsonify({"error": "Unable to save voicing"}), 500

    return jsonify({
        "message": "Voicing saved",
        "voicing": saved_voicing,
    }), 201
