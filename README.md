# Harmony Discovery Explorer

> **Hear where a voicing can go, uncover alternate harmonic identities,
> and build progressions through guided discovery.**

![React](https://img.shields.io/badge/React-18.2-blue)
![Vite](https://img.shields.io/badge/Vite-Latest-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Tone.js](https://img.shields.io/badge/Tone.js-Audio-green)

> **A React application that turns an entered voicing into an explorable
> neighborhood of chord colors, bass motions, emotional characters, and
> alternate analyses.**

## Live Demo

[Open Harmony Discovery Explorer](http://3.93.162.237)

![Harmony Discovery Explorer Interface](docs/hero3.png)

------------------------------------------------------------------------

# Why I Built This

Most music software starts with chord progressions, scales, or
substitutions.

I wanted to build something different.

Harmony Discovery Explorer starts with the exact voicing a musician is
hearing and asks a different question:

> **"What else can this harmony become, and how does each possibility sound?"**

Instead of prescribing a single theoretically correct path, the application
keeps useful ambiguity visible. It combines bass-direction exploration,
efficient upper-voice movement, chord recognition, interval analysis, and
real-time playback so the ear can participate in the decision.

Beyond solving a musical problem, this project became an opportunity to
design algorithms, organize complex theory into maintainable software
modules, and build a polished React application from the ground up.

------------------------------------------------------------------------

# Features

## Bass-Guided Harmony Discovery

-   Analyze any chord voicing
-   Generate every supported destination chord
-   Prioritize new-root candidates over same-root recolorings
-   Browse candidates by ascending or descending bass movement
-   Place stationary-bass choices after moving-bass choices
-   Use total semitone travel to resolve otherwise equal candidates
-   Distinct-note assignment using constrained backtracking
-   Enharmonic deduplication with alternate analyses preserved

## Rich Chord Recognition

Supports:

-   Triads
-   Seventh chords
-   Extended chords
-   Suspended chords
-   Altered dominants
-   Modern jazz chord qualities
-   Practical rootless and omitted-tone extended voicings
-   Suspended dominant colors such as 7sus
-   Interval-formula fallback labels for unregistered note sets
-   Multiple valid names shown together when a voicing is harmonically ambiguous
-   Naming priority for defining 3rds and 7ths, then complete chord formulas

## Automatic Theoretical Spelling

-   Correct novice enharmonic input automatically (`D G♭ A` → `D F♯ A`)
-   Normalize mixed sharp/flat input without changing pitch, order, or octave
-   Spell generated notes intervalically from the selected chord root
-   Support theoretical spellings such as F♭ and double accidentals
-   Use one conventional key per pitch class: C, G, D, A, E, B, G♭, D♭,
    A♭, E♭, B♭, and F

## Negative Harmony

-   Reflect any voicing around its first note
-   Show the reflected shadow without replacing the current chord
-   Analyze inversions from their harmonic root rather than their lowest note
-   Play the shadow independently
-   Add the shadow directly to the progression trail

## Keyboard Visualization

-   Display current, generated, inspected, and shadow voicings on a piano
-   Mark the first/reference key with a subtle note-and-octave label
-   Use the analyzed chord's key and interval structure for note labels

## Emotion-Based Discovery

Results are grouped into intuitive musical categories:

-   Warm & At Rest
-   Melancholy & Somber
-   Tension & Pull
-   Dreamy & Floating

## Progression Builder

-   Build progressions one discovery at a time
-   Add generated or negative-harmony voicings
-   Undo / rewind / remove
-   Inspect voicings
-   Re-analyze from any point

## Playback Engine

-   Sampled Salamander Grand Piano
-   FM synth fallback
-   Multiple playback modes
-   Full progression playback

------------------------------------------------------------------------

# Technologies

### Frontend

-   React
-   JavaScript (ES6+)
-   Vite

### Audio

-   Tone.js
-   Salamander Piano Samples

### Engineering

-   Git
-   GitHub
-   Docker
-   Node.js
-   npm

### Cloud

-   AWS deployment 

------------------------------------------------------------------------

# Architecture

``` text
User Input
      │
      ▼
Note Parsing
      │
      ▼
Candidate Generation
      │
      ▼
Bass-Motion & Assignment Solver
      │
      ▼
Chord Recognition
      │
      ▼
Negative Harmony Analysis
      │
      ▼
Emotion Classification
      │
      ▼
Ranked Results
      │
      ▼
Playback Engine
```

------------------------------------------------------------------------

# Project Structure

``` text
harmony-discovery-explorer/

src/
├── HarmonyDiscoveryExplorer.jsx
├── candidatePool.js
├── chordPatterns.js
├── negativeHarmony.js
├── noteParsing.js
└── main.jsx

standalone/
└── HarmonyDiscoveryExplorer.html
```

------------------------------------------------------------------------

# How the Theory Engine Works

1.  Parse the notes entered by the user.
2.  Generate every supported root and chord quality.
3.  Compute a distinct-note mapping between the current voicing and each
    candidate.
4.  Guarantee unique destination notes with a constrained backtracking
    search.
5.  Remove duplicate note sets while preserving alternate chord names.
6.  Rank names by harmonic evidence: defining 3rd and 7th, chord
    completeness, and played root/bass evidence.
7.  Put new-root destinations first and order them by the selected ascending
    or descending bass direction.
8.  Use total movement as a later tie-breaker.
9.  Respell every destination from its selected chord root and key.
10. Group the final results by emotional character.

## How Negative Harmony Works

1.  Treat the first note of the current voicing as the fixed pivot.
2.  Reflect every interval above the pivot downward by the same number of
    semitones.
3.  Order the reflected notes from their new lowest note upward for display
    and playback.
4.  Analyze the complete pitch set to find its harmonic root, including
    supported interpretations whose root is not played.
5.  Use conventional enharmonic spelling for the resulting chord and notes.
6.  If no registered chord matches, display the intervals measured from the
    shadow's lowest note instead of an unnamed result.
7.  Let the user audition the shadow or add it to the progression trail.

------------------------------------------------------------------------

# Getting Started

## Requirements

-   Node.js 18+
-   npm
-   Python 3
-   PostgreSQL

## Install

``` bash
npm install
python -m pip install -r backend/requirements.txt
psql -d harmony_discovery_explorer -f backend/database/schema.sql
```

Copy the safe template for Vite and Flask, set a development `SECRET_KEY` in
`backend/.env`, and start the backend:

``` bash
cp .env.example .env
cp .env.example backend/.env
cd backend
source .venv/bin/activate
python app.py
```

In another terminal, start the frontend:

``` bash
npm run dev
```

Open:

``` text
http://localhost:5173
```

## Environment configuration

Authentication uses Flask's signed server-side session interface with an
HTTP-only cookie. The React client sends credentialed requests to the Flask
backend. During local HTTP development, keep `SESSION_COOKIE_SECURE=false`.
Production must use HTTPS and `SESSION_COOKIE_SECURE=true`.

Backend variables:

-   `APP_ENV` — `development`, `testing`, or `production`; defaults to
    `development`. Production startup fails if `SECRET_KEY` is missing.
-   `SECRET_KEY` — Flask session-signing secret. Use a unique, long random value.
-   `DATABASE_URL` — PostgreSQL connection URI. If absent, libpq's `PGDATABASE`,
    `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, and `PGSSLMODE` variables are
    supported. Local development defaults only the database name to
    `harmony_discovery_explorer`.
-   `SESSION_COOKIE_SECURE` — `false` for local HTTP, `true` for production HTTPS.
-   `SESSION_COOKIE_SAMESITE` — `Lax` by default; accepts `Lax`, `Strict`, or
    `None`. `None` requires a secure cookie.
-   `API_HOST` — Flask development-server bind address; defaults to `127.0.0.1`.
-   `API_PORT` — Flask development-server port; defaults to `5001`.
-   `FLASK_DEBUG` — controls debug mode only when running `backend/app.py`
    directly; defaults to `true` for the existing development workflow.
-   `FRONTEND_ORIGIN` — exact permitted frontend origin; defaults to
    `http://localhost:5173` in development and is required in production.
    Wildcard origins are not used with cookies.
-   `LOG_LEVEL` — standard Python log level such as `INFO` or `WARNING`.

Frontend variables:

-   `VITE_API_BASE_URL` — Flask API origin. It defaults to
    `http://localhost:5001` in development and is required for production
    builds. Keep its hostname aligned with the frontend hostname for cookies.
-   `VITE_SAMPLE_BASE_URL` — optional piano sample host override.

Only `VITE_*` values are embedded into browser code. Never put secrets in them.
The committed `.env.example` contains placeholders; local `.env` files are
ignored by Git and Docker.

Apply additive schema changes without dropping existing saved records:

``` bash
psql -d harmony_discovery_explorer -f backend/database/schema.sql
```

The Phase 1 users table is independent of saved voicings and progressions.

## Production foundation

The intended AWS request path is:

``` text
Browser
  → Nginx / HTTPS
  → React static frontend
  → /api reverse proxy
  → Gunicorn / Flask
  → PostgreSQL
```

No deployment is performed by this setup. The root `Dockerfile` is a
multi-stage React build followed by an Nginx static image. Supply the public API
origin at build time:

``` bash
docker build \
  --build-arg VITE_API_BASE_URL=https://example.com \
  -t harmony-frontend .
```

The backend has its own production image:

``` bash
docker build -f backend/Dockerfile -t harmony-backend backend
```

### GitHub Container Registry

GitHub Actions publishes the production Docker images to:

-   `ghcr.io/goober19697/harmony-discovery-explorer-frontend`
-   `ghcr.io/goober19697/harmony-discovery-explorer-backend`

Pushes to `main` publish the `latest` and commit-SHA tags. Version tags matching
`v*` publish semantic-version and commit-SHA tags. A later AWS deployment will
pull these images from GitHub Container Registry; this publishing workflow does
not deploy them.

Outside Docker, run the production server from `backend/`:

``` bash
APP_ENV=production \
SECRET_KEY='set-through-your-secret-manager' \
DATABASE_URL='postgresql://...' \
FRONTEND_ORIGIN='https://example.com' \
gunicorn --bind 0.0.0.0:5001 app:app
```

Production must run behind HTTPS. Set `SESSION_COOKIE_SECURE=true` (the
production default), use an exact `FRONTEND_ORIGIN`, and do not set a cookie
domain unless the deployment topology requires it. `GET /api/health/live`
checks the process; `GET /api/health` returns 200 only when PostgreSQL answers a
minimal connectivity query, otherwise 503. Neither endpoint exposes connection
details.

## Saved-record ownership migration

Phase 2 adds nullable `user_id` columns, guarded foreign keys with
`ON DELETE CASCADE`, ownership indexes, and `NOT VALID` non-null checks to
saved voicings and progressions. The non-null checks apply to every new or
updated row immediately, while allowing existing legacy rows to remain
temporarily unowned.

Apply the idempotent schema:

``` bash
psql harmony_discovery_explorer -f backend/database/schema.sql
```

Legacy rows where `user_id IS NULL` are retained but are not returned by any
authenticated library query. They are never assigned automatically. After
reviewing ownership manually, an administrator may explicitly assign selected
rows:

``` sql
UPDATE voicings SET user_id = <verified_user_id> WHERE id IN (<verified_ids>);
UPDATE progressions SET user_id = <verified_user_id> WHERE id IN (<verified_ids>);
```

Alternatively, confirmed obsolete legacy rows may be deleted explicitly. Once
no `NULL` owners remain, validate the constraints and convert the columns to
native `NOT NULL`:

``` sql
ALTER TABLE voicings VALIDATE CONSTRAINT voicings_user_id_required;
ALTER TABLE progressions VALIDATE CONSTRAINT progressions_user_id_required;
ALTER TABLE voicings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE progressions ALTER COLUMN user_id SET NOT NULL;
```

## Production

``` bash
npm run build
npm run preview
```

Deploy the generated **dist/** directory to any static hosting provider.

------------------------------------------------------------------------

# Roadmap

-   Hero landing page
-   Saved progressions
-   MIDI export
-   Cloud synchronization
-   User accounts
-   Voice Neighborhood Mode
-   Journey Mode
-   Mobile optimization
-   Additional instrument libraries

------------------------------------------------------------------------

# License

This repository is currently shared as a portfolio project. A formal
open-source license has not yet been selected.

------------------------------------------------------------------------

## About This Project

This project represents my ongoing journey into software engineering,
combining algorithm design, React development, user experience, and
music theory into a single application. It serves as both a practical
musical tool and a demonstration of how I approach solving complex
technical problems through thoughtful software design.
