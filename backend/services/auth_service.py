import re

from psycopg.errors import UniqueViolation
from werkzeug.security import check_password_hash, generate_password_hash

from database.db import get_user_by_email, get_user_by_id, insert_user

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


class DuplicateEmailError(Exception):
    pass


def normalize_email(value):
    return str(value or "").strip().lower()


def public_user(user):
    if user is None:
        return None
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user.get("display_name"),
        "created_at": user["created_at"],
    }


def validate_password(user, password):
    return bool(
        user
        and isinstance(password, str)
        and check_password_hash(user["password_hash"], password)
    )


def create_user(data):
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    email = normalize_email(data.get("email"))
    password = data.get("password")
    display_name = data.get("display_name")

    if not email or not isinstance(password, str):
        raise ValueError("Email and password are required.")
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValueError("Enter a valid email address.")
    if len(email) > 255:
        raise ValueError("Email must be 255 characters or fewer.")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
        )
    if display_name is not None:
        if not isinstance(display_name, str):
            raise ValueError("Display name must be text.")
        display_name = display_name.strip() or None
        if display_name and len(display_name) > 100:
            raise ValueError("Display name must be 100 characters or fewer.")

    password_hash = generate_password_hash(password)
    try:
        return insert_user(
            email=email,
            password_hash=password_hash,
            display_name=display_name,
        )
    except UniqueViolation as error:
        raise DuplicateEmailError("An account with that email already exists.") from error


def authenticate_user(email, password):
    normalized_email = normalize_email(email)
    if (
        not EMAIL_PATTERN.fullmatch(normalized_email)
        or not isinstance(password, str)
        or not password
    ):
        return None
    user = get_user_by_email(normalized_email)
    return user if validate_password(user, password) else None


def find_user_by_id(user_id):
    return get_user_by_id(user_id)
