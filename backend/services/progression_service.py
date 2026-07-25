from database.db import insert_progression


def create_progression(data):
    if not isinstance(data, dict):
        raise ValueError("request body must be a JSON object")

    title = str(data.get("title", "")).strip() or "Untitled Progression"
    progression = data.get("progression")

    if not isinstance(progression, list) or not progression:
        raise ValueError("progression must be a non-empty list")

    for index, step in enumerate(progression):
        if not isinstance(step, dict):
            raise ValueError(f"progression step {index + 1} must be an object")

        notes = step.get("notes")
        if not isinstance(notes, str) or not notes.strip():
            raise ValueError(f"progression step {index + 1} requires notes")

    return insert_progression(title=title, progression=progression)
