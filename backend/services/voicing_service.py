from database.db import insert_voicing


def create_voicing(data):
    notes = str(data.get("notes", "")).strip()
    chord_name = str(data.get("chord_name", "")).strip() or None
    emotion = str(data.get("emotion", "")).strip() or None

    if not notes:
        raise ValueError("notes is required")

    return insert_voicing(
        notes=notes,
        chord_name=chord_name,
        emotion=emotion,
    )
