from database.db import (
    delete_voicing,
    get_all_voicings,
    insert_voicing,
    update_voicing_record,
)


def create_voicing(user_id, data):
    notes = str(data.get("notes", "")).strip()
    chord_name = str(data.get("chord_name", "")).strip() or None
    emotion = str(data.get("emotion", "")).strip() or None

    if not notes:
        raise ValueError("notes is required")

    return insert_voicing(
        user_id=user_id,
        notes=notes,
        chord_name=chord_name,
        emotion=emotion,
    )


def list_voicings(user_id):
    return get_all_voicings(user_id)


def remove_voicing(user_id, voicing_id):
    return delete_voicing(user_id, voicing_id)


def update_voicing(user_id, voicing_id, data):
    if not isinstance(data, dict):
        raise ValueError("request body must be a JSON object")
    if "favorite" not in data:
        raise ValueError("favorite is required")
    if not isinstance(data["favorite"], bool):
        raise ValueError("favorite must be a boolean")
    return update_voicing_record(user_id, voicing_id, data["favorite"])
