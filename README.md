# Hebron Coding Hackathon

A full-stack live scoring + leaderboard app for the Hebron Coding Hackathon
2026. Built with FastAPI (Python) on the backend and React + Vite on the
frontend, it supports three user roles (admin, judge, team) and works in both
Arabic (RTL, default) and English.

## Features

- **Multi-role auth** — admin, judge, and team accounts with JWT login.
- **Live leaderboard** with per-category scoring and atomic upserts so
  concurrent judges can't race each other.
- **Freezable leaderboard** — admin can freeze the scoreboard during the
  final stretch; the public view switches to a snapshot + frost theme while
  judges continue to score in the background.
- **Hackathon state machine** (upcoming → live → ended) with an
  admin-controlled override and a configurable duration picker.
- **API key distribution** — admin uploads a CSV of API keys and the backend
  assigns one per team. Teams see their key in the Team tab once the admin
  reveals them.
- **Bilingual UI** (Arabic RTL default, English LTR) with live language
  switching.
- **PWA** with standalone mode on iOS home screens.

---

## Quick start (development)

Prereqs: Docker + Docker Compose, or Python 3.12 + Node 20 if you want to run
services directly.

### Option A — Docker

```bash
# 1. Copy the example env and fill in a SECRET_KEY
cp .env.example .env
# then edit .env — at minimum set SECRET_KEY (any random string)

# 2. Build and start both services
docker compose up --build
```

The frontend is at http://localhost:3000, backend at http://localhost:8000,
API docs at http://localhost:8000/docs.

### Option B — run services directly

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
ENV=development SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))") \
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in a separate terminal)
cd frontend
bun install            # or: npm install
bun run dev --host     # or: npm run dev -- --host
```

---

## Default credentials

The backend seeds **one** bootstrap account on a fresh database — the admin.
Everyone else is created from inside the app:

- **Judges** are created by the admin through the *Manage Judges* panel.
- **Teams** register themselves through the public registration form.

| Role  | Username | Default password | Environment variable |
|-------|----------|------------------|----------------------|
| Admin | `admin`  | `admin1232026`   | `ADMIN_PASSWORD`     |

**Change the admin password in production** by setting `ADMIN_PASSWORD`
before the first boot. The backend refuses to start in production
(`ENV=production`) if `ADMIN_PASSWORD`, `SECRET_KEY`, or `CORS_ORIGINS` are
missing.

To reset to a clean DB at any time, delete `backend/hackathon.db` (or the
`backend-data` Docker volume) and restart the backend.

---

## Environment variables

### Backend

| Variable                     | Required | Description                                                         |
|------------------------------|----------|---------------------------------------------------------------------|
| `ENV`                        | optional | `development` (default) or `production`. Prod enforces strict env checks. |
| `SECRET_KEY`                 | **yes**  | JWT signing secret. Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`. |
| `DATABASE_URL`               | optional | SQLAlchemy URL. Defaults to `sqlite+aiosqlite:///./hackathon.db`. In Docker: `sqlite+aiosqlite:///./data/hackathon.db`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| optional | JWT lifetime in minutes. Default 1440 (24h).                         |
| `ADMIN_PASSWORD`             | prod     | Seed password for the `admin` bootstrap account on empty DB.         |
| `CORS_ORIGINS`               | prod     | Comma-separated allowlist of frontend origins, e.g. `https://hackathon.example.com`. `*` is only accepted in dev. |

### Frontend (Vite build-time args)

| Variable               | Description                                         |
|------------------------|-----------------------------------------------------|
| `VITE_USE_MOCK_DATA`   | `true` uses localStorage mock data, `false` uses the backend API. |
| `VITE_API_ENDPOINT`    | Backend URL baked into the build. Defaults to `http://<current-host>:8000` at runtime if the env var is localhost. |

---

## Database migrations

Migrations live in `backend/alembic/versions/`. They're applied automatically
in the Docker backend's startup command, but you can run them manually:

```bash
cd backend
source venv/bin/activate
alembic upgrade head     # apply all pending
alembic current          # show current revision
alembic history          # list all revisions
```

Creating a new migration after a model change:

```bash
alembic revision --autogenerate -m "describe the change"
# Then EDIT the generated file — SQLite doesn't support ALTER COLUMN so you
# usually need to wrap changes in op.batch_alter_table(...).
alembic upgrade head
```

---

## Resetting data / creating default seed accounts

Use the included reseed script from the backend directory:

```bash
cd backend
source venv/bin/activate
python reseed.py
```

This wipes all users/teams/judges/members/scores and recreates just:

- `admin` / `$ADMIN_PASSWORD`
- `judge` / `$JUDGE_PASSWORD` (UI/UX category)
- `team`  / `$TEAM_PASSWORD`

---

## Deploying to production (EC2 + Caddy)

The docker-compose stack includes three services:

- **backend** — FastAPI on port 8000, not publicly exposed
- **frontend** — nginx serving the Vite build on port 80, not publicly exposed
- **caddy** — reverse proxy on ports 80 + 443, the only public entry point

Caddy terminates TLS with an automatic Let's Encrypt cert and routes
`/api/*` + `/health` to the backend and everything else to the frontend.
The frontend uses **same-origin** API calls (empty `VITE_API_ENDPOINT`)
so the image is domain-agnostic.

### Step by step

1. **Create an EC2 instance** (t3.small is plenty; Amazon Linux 2023 or
   Ubuntu 22.04 both work). In the security group, allow inbound:
   - **22** from your IP only (SSH)
   - **80** from anywhere (HTTP, needed for Let's Encrypt ACME challenge)
   - **443** from anywhere (HTTPS)
   Do NOT expose ports 8000 or 3000.

2. **Point your domain** at the instance's elastic IP (A record).
   Wait for DNS to propagate before continuing.

3. **SSH in and install Docker**:
   ```bash
   # Amazon Linux 2023:
   sudo dnf install -y docker git
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   # Log out and back in so the group takes effect.
   ```

4. **Clone the repo and create `.env`**:
   ```bash
   git clone https://github.com/Iztech-team/hackathon.git
   cd hackathon
   cp .env.example .env
   nano .env
   ```
   Fill in the values:
   ```bash
   ENV=production
   SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
   ADMIN_PASSWORD=<strong password>
   CORS_ORIGINS=https://hackathon.your-domain.com
   HACKATHON_DOMAIN=hackathon.your-domain.com
   # Leave VITE_API_ENDPOINT blank for same-origin mode
   VITE_API_ENDPOINT=
   ```

5. **Bring the stack up**:
   ```bash
   docker compose up -d --build
   docker compose logs -f caddy   # watch the Let's Encrypt handshake
   ```
   Caddy will provision a TLS cert in ~30 seconds on first boot.

6. **Verify**:
   - `curl https://hackathon.your-domain.com/health` → `{"status":"healthy"}`
   - The login page loads at `https://hackathon.your-domain.com/login`
   - Log in as `admin` with the password you set in `ADMIN_PASSWORD`

### Database backups

While the app is running, back up the SQLite database periodically:

```bash
docker compose exec backend sqlite3 /app/data/hackathon.db \
  ".backup /app/data/hackathon-$(date +%Y%m%d-%H%M).db"
```

Schedule this as a cron job on the host. The backup file lives inside the
`backend-data` Docker volume — copy it out with `docker cp` or mount a
host directory.

### Updating the deployed app

```bash
cd hackathon
git pull
docker compose up -d --build
```

The backend runs alembic migrations automatically on container start, so
schema changes are applied before the app comes online.

---

## Architecture

```
┌────────────┐     HTTPS      ┌──────────┐     SQL    ┌─────────┐
│  Browser   │───────────────▶│  nginx   │───────────▶│ FastAPI │
│ (React PWA)│                │ (static) │            │ backend │
└────────────┘                └──────────┘            └────┬────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │ SQLite (WAL) │
                                                    └──────────────┘
```

- `frontend/` — Vite + React 18 + Tailwind + framer-motion + react-router-dom
  + i18next. Built into static files served by nginx inside a Docker image.
- `backend/` — FastAPI + async SQLAlchemy + aiosqlite + alembic. JWT auth
  with bcrypt. Rate limiting via slowapi. Logs all requests with timing.
- `docker-compose.yml` — two services: `backend` (Python) and `frontend`
  (nginx). Backend exposes `:8000`, frontend `:3000`. The SQLite file lives
  in a named volume `backend-data`.

---

## Troubleshooting

**"no such column: teams.api_key" on startup**
Run `alembic upgrade head` — a migration is outstanding.

**"FATAL: SECRET_KEY environment variable is required in production"**
Set `SECRET_KEY` in your `.env` file or shell environment.

**iPhone PWA can't reach the backend**
The frontend auto-targets the current hostname's port 8000. Make sure the
backend is reachable from the phone's network and that `CORS_ORIGINS`
includes the frontend's origin (or is `*` in dev).

**Leaderboard shows "no teams" briefly after freeze**
The snapshot is fetched once the page mounts. There's a 180ms grace period
before a skeleton is shown, so fast fetches are invisible.

---

## License

Private project for the Hebron Coding Hackathon 2026.
