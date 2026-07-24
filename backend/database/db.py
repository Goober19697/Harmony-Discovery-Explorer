import psycopg

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
