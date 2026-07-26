# Harmony Discovery Explorer

Harmony Discovery Explorer is a full-stack web application for exploring chord voicings, negative harmony, and harmonic progressions. Built with React, Flask, PostgreSQL, Docker, and GitHub Actions.

## Screenshot

![Harmony Discovery Explorer interface](docs/hero3.png)

## Features

- Interactive chord exploration
- Automatic chord naming
- Voice-leading suggestions
- Negative harmony generation
- Save voicings
- Save progressions
- Multi-user authentication
- Personal libraries per account
- Search saved library
- Favorites
- Rename saved progressions
- Restore saved voicings
- Restore saved progressions
- Playback controls
- Responsive interface

## Technology Stack

### Frontend

- React
- Vite
- JavaScript

### Backend

- Flask
- REST API
- Gunicorn

### Database

- PostgreSQL

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- GitHub Container Registry (GHCR)

### Authentication

- Secure session authentication
- User-owned saved libraries

## Project Architecture

```text
Harmony Discovery Explorer
│
├── React Frontend
├── Flask REST API
├── PostgreSQL
├── Docker
├── Docker Compose
└── GitHub Actions CI/CD
```

The React client provides harmony analysis, audio playback, progression
building, and library management. It communicates with the Flask REST API,
which handles authentication and account-scoped data access. PostgreSQL stores
users, voicings, progressions, and favorites.

## Installation

The recommended way to run the complete application locally is Docker Compose.

### Requirements

- Docker with Docker Compose
- Git

### Start the application

```bash
git clone https://github.com/Goober19697/HARMONY-DISCOVERY-EXPLORER.git
cd HARMONY-DISCOVERY-EXPLORER
docker compose up --build
```

Open `http://localhost:8080` in a browser. The Compose stack starts:

- The React frontend on port `8080`
- The Flask API on port `5001`
- PostgreSQL on the internal Compose network

Database data is retained in the `postgres_data` Docker volume. Stop the stack
with:

```bash
docker compose down
```

The values included in `compose.yaml` are intended for local development.
Production credentials and environment configuration must be supplied by the
deployment environment.

## Development

For frontend development outside Docker:

```bash
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173`.

For backend development, create a Python environment, install the backend
dependencies, configure the local environment, and start Flask:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install -r backend/requirements.txt
cp .env.example backend/.env
cd backend
python app.py
```

The Flask development server expects PostgreSQL to be available and the schema
from `backend/database/schema.sql` to be applied. Environment values such as
the database connection and local session key are configured in
`backend/.env`.

Docker Compose can also start the complete frontend, API, and PostgreSQL stack
for integrated development:

```bash
docker compose up --build
```

## Production

- The frontend is compiled by Vite and served as static assets by Nginx.
- The Flask backend is served by Gunicorn.
- GitHub Actions automatically builds `linux/amd64` frontend and backend
  container images.
- Images are published to GitHub Container Registry:
  - `ghcr.io/goober19697/harmony-discovery-explorer-frontend`
  - `ghcr.io/goober19697/harmony-discovery-explorer-backend`
- Docker Compose is used to coordinate the frontend, backend, and PostgreSQL
  services for deployment.

Pushes to `main` publish `latest` and commit-SHA image tags. Git tags matching
`v*` publish semantic-version and commit-SHA tags.

## Current Status

- ✓ Multi-user accounts
- ✓ Persistent PostgreSQL storage
- ✓ Authentication
- ✓ Saved personal libraries
- ✓ Dockerized services
- ✓ CI/CD pipeline
- ✓ Production-ready container builds

## Roadmap

- [ ] Cloud deployment
- [ ] Password reset
- [ ] Email verification
- [ ] User profiles
- [ ] Shared progression links
- [ ] MIDI export
- [ ] Advanced search
- [ ] Audio improvements
- [ ] Microtonal tuning
- [ ] Scale explorer
- [ ] Voice-leading analytics

## License

This repository is currently shared as a portfolio project. A formal
open-source license has not yet been selected.
