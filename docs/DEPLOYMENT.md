# Deployment Guide

This project is deployed on a **Hetzner VPS** running **Dokploy** as the container orchestrator. The frontend and backend are deployed as separate services, each backed by Docker Compose.

---

## Architecture Overview

```
GitHub (main branch push)
        │
        ▼
GitHub Actions (ubuntu-latest)
  ├─ Builds Next.js Docker image (client/)
  ├─ Pushes to GHCR: ghcr.io/ninjaruss/l-file/client:latest
  └─ Calls Dokploy webhook → triggers frontend redeploy
                                      │
                              ┌───────▼────────┐
                              │   Dokploy VPS  │
                              │                │
                              │  ┌──────────┐  │
                              │  │ Frontend │  │  ← pulls pre-built GHCR image
                              │  │ :3000    │  │     client/docker-compose.prod.yml
                              │  └──────────┘  │
                              │  ┌──────────┐  │
                              │  │ Backend  │  │  ← built by Dokploy from source
                              │  │ :3001    │  │     server/docker-compose.prod.yml
                              │  └──────────┘  │
                              │                │
                              │  dokploy-network (external bridge)
                              └────────────────┘
```

**Key design decision**: The Next.js build is CPU/memory-intensive, so it runs on GitHub Actions rather than on the VPS. Dokploy only runs the pre-built image for the frontend. The NestJS backend is lightweight to build, so Dokploy builds it directly from source.

---

## Repository Structure

| File | Purpose |
|------|---------|
| `client/Dockerfile` | Multi-stage Next.js build → standalone runtime image |
| `server/Dockerfile` | Multi-stage NestJS build → production runtime image |
| `client/docker-compose.prod.yml` | Frontend service (pulls from GHCR) |
| `server/docker-compose.prod.yml` | Backend service (build from source) |
| `server/docker-compose.yml` | Development server with hot reload |
| `.github/workflows/deploy-frontend.yml` | CI/CD pipeline for frontend |

---

## GitHub Actions — Frontend CI/CD

**Workflow file**: [.github/workflows/deploy-frontend.yml](../.github/workflows/deploy-frontend.yml)

**Triggers**:
- Push to `main` branch touching `client/**` or the workflow file itself
- Manual via `workflow_dispatch`

**Steps**:
1. Check out repository
2. Log in to GitHub Container Registry (GHCR) using `GITHUB_TOKEN`
3. Extract Docker metadata (tags: `sha-<commit>` and `latest`)
4. Build the Docker image with `NEXT_PUBLIC_API_URL` baked in as a build arg
5. Push image to `ghcr.io/ninjaruss/l-file/client`
6. POST to the Dokploy webhook URL to trigger a redeploy

**Layer caching**: Uses GitHub Actions cache (`type=gha`) to dramatically speed up subsequent builds — only changed layers are rebuilt.

### Required GitHub Secrets

Set these under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Public backend API URL (e.g. `https://api.l-file.com/api`) — baked into the client bundle at build time |
| `DOKPLOY_WEBHOOK_URL` | Full webhook URL from Dokploy app settings (includes the token) |

---

## Dokploy — Frontend Service

**Source**: Docker Compose → `client/docker-compose.prod.yml`

The compose file pulls `ghcr.io/ninjaruss/l-file/client:latest` with `pull_policy: always` so every redeploy gets the freshest image.

### Environment Variables (set in Dokploy UI)

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Must match the server's `JWT_SECRET` |
| `AUTH_URL` | Canonical frontend URL (e.g. `https://l-file.com`) |
| `AUTH_INTERNAL_SECRET` | Shared secret for internal auth API calls |
| `AUTH_RESEND_KEY` | Resend API key for magic link / verification emails |
| `EMAIL_FROM` | From address for auth emails |
| `API_URL` | Backend URL for **server-side** Next.js requests |
| `NEXT_PUBLIC_API_URL` | Backend URL for **client-side** requests (also needed at runtime) |

> **Note**: `NEXT_PUBLIC_API_URL` must also be set as a **GitHub Secret** because it is baked into the JS bundle at build time by GitHub Actions. The runtime env var is a fallback.

### Resource Limits

```yaml
cpus: '0.5'
memory: 512M
```

---

## Dokploy — Backend Service

**Source**: Docker Compose → `server/docker-compose.prod.yml`

Dokploy builds the NestJS image directly from the `server/` directory using the multi-stage `server/Dockerfile`. The production stage (`runner`) uses a non-root `nestjs` user and `dumb-init` for proper signal handling.

### Environment Variables (set in Dokploy UI)

| Variable | Description |
|----------|-------------|
| `DATABASE_HOST` | Supabase pooler host (`aws-0-us-west-2.pooler.supabase.com`) |
| `DATABASE_PORT` | Pooler port (default `5432`) |
| `DATABASE_USERNAME` | Supabase pooler username (`postgres.<project-id>`) |
| `DATABASE_PASSWORD` | Supabase database password |
| `DATABASE_NAME` | Database name (default `postgres`) |
| `DATABASE_SSL` | Enable SSL (default `true`) |
| `RUN_MIGRATIONS` | Auto-run migrations on startup (default `true` in prod) |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES` | JWT expiry (default `1d`) |
| `FLUXER_CLIENT_ID` | Fluxer OAuth2 application client ID |
| `FLUXER_CLIENT_SECRET` | Fluxer OAuth2 application client secret |
| `FLUXER_CALLBACK_URL` | OAuth2 callback URL (e.g. `https://api.l-file.com/api/auth/fluxer/callback`) |
| `ADMIN_FLUXER_ID` | Fluxer user ID to auto-promote to admin |
| `FRONTEND_URL` | Frontend origin (e.g. `https://l-file.com`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `RESEND_API_KEY` | Resend API key for verification emails |
| `B2_APPLICATION_KEY_ID` | Backblaze B2 application key ID |
| `B2_APPLICATION_KEY` | Backblaze B2 application key |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name |
| `B2_BUCKET_ID` | Backblaze B2 bucket ID |
| `KOFI_WEBHOOK_TOKEN` | Ko-fi webhook verification token (optional) |

> **Database**: Always use the Supabase **pooler** connection (not the direct `db.*.supabase.co` host), as the direct host requires IPv6.

### Resource Limits

```yaml
cpus: '1'
memory: 1G
```

---

## Networking

Both services attach to the `dokploy-network` external bridge network, which Dokploy creates automatically. This allows Dokploy's reverse proxy (Traefik) to route traffic to each service by domain name.

```yaml
networks:
  dokploy-network:
    external: true
```

---

## Dockerfiles

### Frontend (`client/Dockerfile`)

Three-stage build:

1. **`deps`** — installs all Node dependencies from `yarn.lock`
2. **`builder`** — runs `yarn build` with `NEXT_PUBLIC_API_URL` baked in; produces a Next.js [standalone output](https://nextjs.org/docs/advanced-features/output-file-tracing)
3. **`runner`** — minimal Alpine image running as non-root user `nextjs`; only copies `standalone/`, `static/`, and `public/`

### Backend (`server/Dockerfile`)

Three-stage build:

1. **`deps`** — installs all dependencies (including build tools for native modules like `bcrypt`)
2. **`builder`** — compiles TypeScript and prunes dev dependencies
3. **`runner`** — minimal Alpine image with `dumb-init`, running as non-root user `nestjs`; only copies `dist/`, `node_modules/`, and migration scripts

---

## First-Time Dokploy Setup

1. **Install Dokploy** on the VPS and open the required firewall ports (HTTP/80, HTTPS/443, Dokploy UI/3000).
2. **Create two applications** in Dokploy (or use "Docker Compose" type for each):
   - **Frontend** → Source: Docker Compose, file: `client/docker-compose.prod.yml`
   - **Backend** → Source: Docker Compose, file: `server/docker-compose.prod.yml`
3. **Set environment variables** for each service in the Dokploy UI (see tables above).
4. **Configure GHCR access** for the frontend: Dokploy needs to be authenticated to pull from `ghcr.io`. In Dokploy's registry settings, add GHCR with your GitHub username and a Personal Access Token (PAT) with `read:packages` scope.
5. **Get the webhook URL** from the frontend application settings in Dokploy and save it as the `DOKPLOY_WEBHOOK_URL` GitHub Secret.
6. **Set GitHub Secrets** (`NEXT_PUBLIC_API_URL`, `DOKPLOY_WEBHOOK_URL`).
7. Push to `main` — GitHub Actions will build and deploy automatically.

---

## Triggering Deploys

| Scenario | How |
|----------|-----|
| Frontend code change | Push to `main` touching `client/**` — GitHub Actions handles everything |
| Backend code change | Push to `main` → manually redeploy backend service in Dokploy UI, or configure a second webhook workflow |
| Force frontend redeploy | Trigger workflow manually via GitHub Actions → `workflow_dispatch` |
| Config/env change only | Update env vars in Dokploy UI → redeploy from Dokploy UI |

---

## Health Checks

Both services expose health check endpoints that Docker and Dokploy monitor:

| Service | Endpoint | Interval |
|---------|----------|----------|
| Frontend | `http://localhost:3000` | 30s |
| Backend | `http://localhost:3001/api/health` | 30s |

---

## Logging

Both production compose files use the `json-file` log driver with rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

View logs via Dokploy UI or: `docker logs l-file-server -f` / `docker logs l-file-frontend -f`
