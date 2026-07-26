from flask import Blueprint, jsonify, request, session

from services.auth_service import (
    DuplicateEmailError,
    authenticate_user,
    create_user,
    find_user_by_id,
    public_user,
)

auth_blueprint = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_blueprint.post("/register")
def register():
    try:
        user = create_user(request.get_json(silent=True))
    except DuplicateEmailError as error:
        return jsonify({"error": str(error)}), 409
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        print(f"Failed to register user: {error}")
        return jsonify({"error": "Unable to create account."}), 500

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"user": public_user(user)}), 201


@auth_blueprint.post("/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid email or password."}), 401

    try:
        user = authenticate_user(data.get("email"), data.get("password"))
    except Exception as error:
        print(f"Failed to log in user: {error}")
        return jsonify({"error": "Unable to log in."}), 500

    if user is None:
        return jsonify({"error": "Invalid email or password."}), 401

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"user": public_user(user)}), 200


@auth_blueprint.post("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out."}), 200


@auth_blueprint.get("/me")
def current_user():
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Authentication required."}), 401

    try:
        user = find_user_by_id(user_id)
    except Exception as error:
        print(f"Failed to load current user: {error}")
        return jsonify({"error": "Unable to load account."}), 500

    if user is None:
        session.clear()
        return jsonify({"error": "Authentication required."}), 401
    return jsonify({"user": public_user(user)}), 200
