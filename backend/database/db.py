import psycopg
from psycopg.types.json import Jsonb

DATABASE_NAME = "harmony_discovery_explorer"


def get_connection():
    return psycopg.connect(
        dbname=DATABASE_NAME,
        user="jacobdonaldrasbornik"
    )


def insert_voicing(notes, chord_name=None, emotion=None):
    sql = """
        INSERT INTO voicings (notes, chord_name, emotion)
        VALUES (%s, %s, %s)
        RETURNING id, notes, chord_name, emotion, created_at;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (notes, chord_name, emotion))
            row = cursor.fetchone()

    return {
        "id": row[0],
        "notes": row[1],
        "chord_name": row[2],
        "emotion": row[3],
        "created_at": row[4].isoformat(),
    }


def insert_progression(title, progression):
    sql = """
        INSERT INTO progressions (title, progression)
        VALUES (%s, %s)
        RETURNING id, title, progression, created_at;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (title, Jsonb(progression)))
            row = cursor.fetchone()

    return {
        "id": row[0],
        "title": row[1],
        "progression": row[2],
        "created_at": row[3].isoformat(),
    }


def get_all_voicings():
    sql = """
        SELECT id, notes, chord_name, emotion, created_at
        FROM voicings
        ORDER BY created_at DESC, id DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "notes": row[1],
            "chord_name": row[2],
            "emotion": row[3],
            "created_at": row[4].isoformat(),
        }
        for row in rows
    ]


def get_all_progressions():
    sql = """
        SELECT id, title, progression, created_at
        FROM progressions
        ORDER BY created_at DESC, id DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "title": row[1],
            "progression": row[2],
            "created_at": row[3].isoformat(),
        }
        for row in rows
    ]


def update_progression_record(progression_id, title=None, progression=None):
    assignments = []
    values = []
    if title is not None:
        assignments.append("title = %s")
        values.append(title)
    if progression is not None:
        assignments.append("progression = %s")
        values.append(Jsonb(progression))

    sql = f"""
        UPDATE progressions
        SET {", ".join(assignments)}
        WHERE id = %s
        RETURNING id, title, progression, created_at;
    """
    values.append(progression_id)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, tuple(values))
            row = cursor.fetchone()

    if row is None:
        return None

    return {
        "id": row[0],
        "title": row[1],
        "progression": row[2],
        "created_at": row[3].isoformat(),
    }


def delete_voicing(voicing_id):
    sql = "DELETE FROM voicings WHERE id = %s RETURNING id;"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (voicing_id,))
            row = cursor.fetchone()
    return row is not None


def delete_progression(progression_id):
    sql = "DELETE FROM progressions WHERE id = %s RETURNING id;"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (progression_id,))
            row = cursor.fetchone()
    return row is not None
