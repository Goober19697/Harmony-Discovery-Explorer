# Harmony Discovery Explorer

Harmony Discovery Explorer is a full-stack web application for exploring chord voicings, Shadow Voicing transformations, and harmonic progressions. Built with React, Flask, PostgreSQL, Docker, and GitHub Actions.

## Live Demo

[Launch Harmony Discovery Explorer](http://3.93.162.237)

> The application is currently hosted on AWS EC2. Because the deployment currently uses the instance public IP rather than a domain, the address may change if the instance is stopped and restarted.

## Screenshot

![Harmony Discovery Explorer interface featuring Shadow Voicing](docs/hero4.png)

## Features

- Interactive chord exploration
- Automatic chord naming
- Voice-leading suggestions
- Explore Shadow Voicing transformations
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
- AWS EC2
- Nginx reverse proxy

### Authentication

- Secure session authentication
- User-owned saved libraries

## Project Architecture

```text
Harmony Discovery Explorer
│
├── React + Vite Frontend
├── Nginx Reverse Proxy
├── Flask REST API + Gunicorn
├── PostgreSQL
├── Docker + Docker Compose
├── GitHub Actions + GHCR
└── AWS EC2
```

The React client provides harmony analysis, audio playback, progression
building, and library management. It communicates with the Flask REST API,
which handles authentication and account-scoped data access. PostgreSQL stores
users, voicings, progressions, and favorites. In production, Nginx serves the
Vite build and forwards `/api` requests to the Gunicorn-hosted Flask service.

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

## Production Deployment

```text
Code push
→ GitHub Actions
→ frontend and backend Docker images
→ GitHub Container Registry
→ AWS EC2
→ Docker Compose
→ Nginx, Flask, and PostgreSQL
```

- The frontend is compiled by Vite and served as static assets by Nginx.
- Nginx reverse-proxies `/api` requests to the Flask REST API.
- The Flask backend runs behind Gunicorn.
- GitHub Actions automatically builds `linux/amd64` frontend and backend
  container images.
- Images are published to GitHub Container Registry:
  - `ghcr.io/goober19697/harmony-discovery-explorer-frontend`
  - `ghcr.io/goober19697/harmony-discovery-explorer-backend`
- Docker Compose is used to coordinate the frontend, backend, and PostgreSQL
  services on AWS EC2.

Pushes to `main` publish `latest` and commit-SHA image tags. Git tags matching
`v*` publish semantic-version and commit-SHA tags.

Wait for GitHub Actions to finish publishing both images before updating the
EC2 deployment. From the repository root on the instance, run:

```bash
git pull
./scripts/deploy.sh
```

The deployment script pulls the current GHCR images, reconciles the production
Compose services, and verifies the public frontend and backend health
endpoints. It does not run `git pull` or remove the PostgreSQL volume.

The equivalent manual commands are:

```bash
docker compose --env-file .env -f compose.prod.yaml pull
docker compose --env-file .env -f compose.prod.yaml up -d
docker compose --env-file .env -f compose.prod.yaml ps
```

The production `.env` file is managed only on the deployment host and is not
committed to the repository.

### Session cookies

Production defaults to `SESSION_COOKIE_SECURE=true`. Keep this setting when the
application is served over HTTPS. For a temporary deployment using only an HTTP
public IP, set `SESSION_COOKIE_SECURE=false` in the host's production `.env` so
the browser can return the session cookie with authenticated API requests.

Keep `SESSION_COOKIE_SAMESITE=Lax`; the HTTP workaround does not require
weakening SameSite behavior. The frontend continues to include credentials in
all API requests. Restore `SESSION_COOKIE_SECURE=true` as soon as HTTPS is
configured.

### Maintenance

The legacy `voice-leading-explorer` container image and old deployment
directory may be removed manually only after the current production deployment
has been fully verified. The repository does not automatically delete GitHub
packages or directories on the EC2 instance.

## Current Status

- ✓ Multi-user accounts
- ✓ Persistent PostgreSQL storage
- ✓ Authentication
- ✓ Saved personal libraries
- ✓ Dockerized services
- ✓ CI/CD pipeline
- ✓ Production-ready container builds
- ✓ AWS EC2 deployment

## Roadmap

- [ ] Domain name and HTTPS
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
