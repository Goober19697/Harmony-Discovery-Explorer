CREATE TABLE IF NOT EXISTS voicings (
    id BIGSERIAL PRIMARY KEY,
    notes TEXT NOT NULL,
    chord_name VARCHAR(100),
    emotion VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progressions (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    progression JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE voicings
ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE progressions
ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE voicings
ADD COLUMN IF NOT EXISTS user_id INTEGER;

ALTER TABLE progressions
ADD COLUMN IF NOT EXISTS user_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'voicings_user_id_fkey'
          AND conrelid = 'voicings'::regclass
    ) THEN
        ALTER TABLE voicings
        ADD CONSTRAINT voicings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'progressions_user_id_fkey'
          AND conrelid = 'progressions'::regclass
    ) THEN
        ALTER TABLE progressions
        ADD CONSTRAINT progressions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'voicings_user_id_required'
          AND conrelid = 'voicings'::regclass
    ) THEN
        ALTER TABLE voicings
        ADD CONSTRAINT voicings_user_id_required
        CHECK (user_id IS NOT NULL) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'progressions_user_id_required'
          AND conrelid = 'progressions'::regclass
    ) THEN
        ALTER TABLE progressions
        ADD CONSTRAINT progressions_user_id_required
        CHECK (user_id IS NOT NULL) NOT VALID;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_voicings_user_id
ON voicings(user_id);

CREATE INDEX IF NOT EXISTS idx_progressions_user_id
ON progressions(user_id);
