from database.db import (
    delete_progression,
    get_all_progressions,
    insert_progression,
    update_progression_record,
)


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


def list_progressions():
    return get_all_progressions()


def update_progression(progression_id, data):
    if not isinstance(data, dict):
        raise ValueError("request body must be a JSON object")

    has_title = "title" in data
    has_progression = "progression" in data
    has_favorite = "favorite" in data
    if not has_title and not has_progression and not has_favorite:
        raise ValueError("title, progression, or favorite is required")

    title = None
    if has_title:
        if not isinstance(data["title"], str):
            raise ValueError("title must be a string")
        title = data["title"].strip() or "Untitled Progression"

    progression = None
    if has_progression:
        progression = data["progression"]
        if not isinstance(progression, list) or not progression:
            raise ValueError("progression must be a non-empty list")

        for index, step in enumerate(progression):
            if not isinstance(step, dict):
                raise ValueError(f"progression step {index + 1} must be an object")

            notes = step.get("notes")
            midi_notes = step.get("midi_notes")
            if (
                (not isinstance(notes, str) or not notes.strip()) and
                (not isinstance(midi_notes, list) or not midi_notes)
            ):
                raise ValueError(f"progression step {index + 1} requires notes")

    favorite = None
    if has_favorite:
        if not isinstance(data["favorite"], bool):
            raise ValueError("favorite must be a boolean")
        favorite = data["favorite"]

    return update_progression_record(
        progression_id,
        title=title,
        progression=progression,
        favorite=favorite,
    )


def remove_progression(progression_id):
    return delete_progression(progression_id)
