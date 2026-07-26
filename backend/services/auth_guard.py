from functools import wraps

from flask import g, jsonify, session


def login_required(route_handler):
    @wraps(route_handler)
    def protected_route(*args, **kwargs):
        user_id = session.get("user_id")
        if user_id is None:
            return jsonify({"error": "Authentication required."}), 401
        g.user_id = user_id
        return route_handler(*args, **kwargs)

    return protected_route
