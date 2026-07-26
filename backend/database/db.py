import psycopg
from psycopg.types.json import Jsonb

DATABASE_NAME = "harmony_discovery_explorer"


def get_connection():
    return psycopg.connect(
        dbname=DATABASE_NAME,
        user="jacobdonaldrasbornik"
    )


def _user_from_row(row):
    if row is None:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "display_name": row[3],
        "created_at": row[4].isoformat(),
    }


def insert_user(email, password_hash, display_name=None):
    sql = """
        INSERT INTO users (email, password_hash, display_name)
        VALUES (%s, %s, %s)
        RETURNING id, email, password_hash, display_name, created_at;
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (email, password_hash, display_name))
            row = cursor.fetchone()
    return _user_from_row(row)


def get_user_by_email(email):
    sql = """
        SELECT id, email, password_hash, display_name, created_at
        FROM users
        WHERE email = %s;
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (email,))
            row = cursor.fetchone()
    return _user_from_row(row)


def get_user_by_id(user_id):
    sql = """
        SELECT id, email, password_hash, display_name, created_at
        FROM users
        WHERE id = %s;
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (user_id,))
            row = cursor.fetchone()
    return _user_from_row(row)


def insert_voicing(user_id, notes, chord_name=None, emotion=None):
    sql = """
        INSERT INTO voicings (user_id, notes, chord_name, emotion)
        VALUES (%s, %s, %s, %s)
        RETURNING id, notes, chord_name, emotion, created_at, favorite;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (user_id, notes, chord_name, emotion))
            row = cursor.fetchone()

    return {
        "id": row[0],
        "notes": row[1],
        "chord_name": row[2],
        "emotion": row[3],
        "created_at": row[4].isoformat(),
        "favorite": row[5],
    }


def insert_progression(user_id, title, progression):
    sql = """
        INSERT INTO progressions (user_id, title, progression)
        VALUES (%s, %s, %s)
        RETURNING id, title, progression, created_at, favorite;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (user_id, title, Jsonb(progression)))
            row = cursor.fetchone()

    return {
        "id": row[0],
        "title": row[1],
        "progression": row[2],
        "created_at": row[3].isoformat(),
        "favorite": row[4],
    }


def get_all_voicings(user_id):
    sql = """
        SELECT id, notes, chord_name, emotion, created_at, favorite
        FROM voicings
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "notes": row[1],
            "chord_name": row[2],
            "emotion": row[3],
            "created_at": row[4].isoformat(),
            "favorite": row[5],
        }
        for row in rows
    ]


def get_all_progressions(user_id):
    sql = """
        SELECT id, title, progression, created_at, favorite
        FROM progressions
        WHERE user_id = %s
        ORDER BY created_at DESC, id DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "title": row[1],
            "progression": row[2],
            "created_at": row[3].isoformat(),
            "favorite": row[4],
        }
        for row in rows
    ]


def update_progression_record(
    user_id, progression_id, title=None, progression=None, favorite=None
):
    assignments = []
    values = []
    if title is not None:
        assignments.append("title = %s")
        values.append(title)
    if progression is not None:
        assignments.append("progression = %s")
        values.append(Jsonb(progression))
    if favorite is not None:
        assignments.append("favorite = %s")
        values.append(favorite)

    sql = f"""
        UPDATE progressions
        SET {", ".join(assignments)}
        WHERE id = %s AND user_id = %s
        RETURNING id, title, progression, created_at, favorite;
    """
    values.extend((progression_id, user_id))

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
        "favorite": row[4],
    }


def update_voicing_record(user_id, voicing_id, favorite):
    sql = """
        UPDATE voicings
        SET favorite = %s
        WHERE id = %s AND user_id = %s
        RETURNING id, notes, chord_name, emotion, created_at, favorite;
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (favorite, voicing_id, user_id))
            row = cursor.fetchone()

    if row is None:
        return None
    return {
        "id": row[0],
        "notes": row[1],
        "chord_name": row[2],
        "emotion": row[3],
        "created_at": row[4].isoformat(),
        "favorite": row[5],
    }


def delete_voicing(user_id, voicing_id):
    sql = "DELETE FROM voicings WHERE id = %s AND user_id = %s RETURNING id;"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (voicing_id, user_id))
            row = cursor.fetchone()
    return row is not None


def delete_progression(user_id, progression_id):
    sql = "DELETE FROM progressions WHERE id = %s AND user_id = %s RETURNING id;"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (progression_id, user_id))
            row = cursor.fetchone()
    return row is not None
