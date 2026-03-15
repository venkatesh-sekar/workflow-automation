# Flow — Split Container Deployment Guide

This guide covers deploying Flow as 3 separate containers: **UI**, **API**, and **Worker**.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI (Nginx) │────▶│  API Server   │────▶│   Worker     │
│   Port 80    │     │  Port 3000    │     │  (no port)   │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                    ┌──────┴───────┐      ┌─────┴──────┐
                    │  PostgreSQL   │      │   Redis     │
                    └──────────────┘      └────────────┘
```

- **UI** — Nginx serving the Vite-built frontend. Proxies `/api/` and `/socket.io` to the API.
- **API** — Node.js server handling REST endpoints, webhooks, and WebSocket connections.
- **Worker** — Node.js process that picks up jobs from Redis and executes flows.

The API and Worker share the same Docker image (`Dockerfile.backend`). The `FLOW_CONTAINER_TYPE` env var controls which mode runs.

## Quick Start

```bash
# 1. Copy and edit environment config
cp .env.example .env.production
# Edit .env.production — at minimum set FLOW_ENCRYPTION_KEY and FLOW_JWT_SECRET

# 2. Build and start all services
docker compose -f docker-compose.split.yml up --build -d

# 3. Verify
curl http://localhost:3000/v1/health    # API health
open http://localhost:8080              # UI
docker compose -f docker-compose.split.yml logs flow-worker  # Worker logs
```

## Building Images

### Frontend (UI)

```bash
docker build -f Dockerfile.ui -t flow-ui .
```

Produces a small Nginx Alpine image (~30MB + static assets). No Node.js runtime.

### Backend (API + Worker)

```bash
docker build -f Dockerfile.backend -t flow-backend .
```

Produces a Node.js image with the server, engine, and all pieces. No Nginx or frontend files. Used for both API and Worker containers.

## Environment Variables

See `.env.example` for the full list with descriptions. Key variables:

| Variable | Required | Description |
|---|---|---|
| `FLOW_ENCRYPTION_KEY` | Yes | 32-char hex key for encrypting secrets |
| `FLOW_JWT_SECRET` | Yes | Secret for JWT token signing |
| `FLOW_CONTAINER_TYPE` | Yes | `APP` for API, `WORKER` for worker |
| `FLOW_POSTGRES_HOST` | Yes | PostgreSQL hostname |
| `FLOW_POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `FLOW_REDIS_HOST` | Yes | Redis hostname |
| `FLOW_FRONTEND_URL` | Yes | Public URL where users access the UI |
| `FLOW_WEBHOOK_URL` | Recommended | Internal URL for worker→API communication |
| `FLOW_WORKER_CONCURRENCY` | No | Concurrent flow executions per worker (default: 10) |
| `FLOW_API_URL` | UI only | Backend URL for nginx proxy (default: `http://flow-api:3000`) |

Generate secrets:
```bash
# Encryption key (32 hex chars)
openssl rand -hex 16

# JWT secret
openssl rand -base64 32
```

## Running Without Docker Compose

### Start infrastructure

```bash
docker run -d --name flow-postgres \
  -e POSTGRES_USER=flow -e POSTGRES_PASSWORD=flow -e POSTGRES_DB=flow \
  -p 5432:5432 postgres:14

docker run -d --name flow-redis -p 6379:6379 redis:7
```

### Start backend containers

```bash
# API
docker run -d --name flow-api \
  --env-file .env.production \
  -e FLOW_CONTAINER_TYPE=APP \
  -p 3000:3000 \
  flow-backend

# Worker
docker run -d --name flow-worker \
  --env-file .env.production \
  -e FLOW_CONTAINER_TYPE=WORKER \
  -e FLOW_WORKER_CONCURRENCY=10 \
  flow-backend
```

### Start UI

```bash
docker run -d --name flow-ui \
  -e FLOW_API_URL=http://flow-api:3000 \
  -p 8080:80 \
  flow-ui
```

When running standalone containers, ensure they share a Docker network so hostnames resolve:

```bash
docker network create flow-net
# Add --network flow-net to each docker run command
```

## Health Checks

- **API**: `GET http://localhost:3000/v1/health` — returns 200 when ready
- **Worker**: Check logs for successful Redis connection and job processing
- **UI**: `GET http://localhost:8080` — returns the frontend HTML

## Scaling Workers

Workers are stateless — scale horizontally by running multiple instances:

```bash
# With docker compose
docker compose -f docker-compose.split.yml up --scale flow-worker=3 -d
```

When scaling, remove `container_name: flow-worker` from the compose file (Docker requires unique container names).

Each worker processes `FLOW_WORKER_CONCURRENCY` jobs concurrently. 3 workers at concurrency 10 = 30 parallel flow executions.

## Production Considerations

### Secrets

- Never commit `.env.production` to version control
- Use Docker secrets, Vault, or your cloud provider's secret manager
- Rotate `FLOW_ENCRYPTION_KEY` and `FLOW_JWT_SECRET` periodically

### SSL/TLS

Place a reverse proxy (Caddy, Traefik, or cloud LB) in front of the UI container to terminate TLS. Example with Caddy:

```
flow.example.com {
    reverse_proxy flow-ui:80
}
```

### Database Backups

```bash
# Automated daily backup
docker exec flow-postgres pg_dump -U flow flow | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Resource Limits

Set memory/CPU limits in production:

```yaml
# In docker-compose.split.yml
flow-api:
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '2'
flow-worker:
  deploy:
    resources:
      limits:
        memory: 4G
        cpus: '4'
```

### Logging

Forward container logs to a central system:

```bash
# View logs
docker compose -f docker-compose.split.yml logs -f flow-api
docker compose -f docker-compose.split.yml logs -f flow-worker
```

Set `FLOW_LOG_LEVEL=warn` in production to reduce noise. Enable `FLOW_LOG_PRETTY=false` for JSON-structured logs.

## Monolithic vs Split Deployment

| | Monolithic (`docker-compose.yml`) | Split (`docker-compose.split.yml`) |
|---|---|---|
| **Images** | 1 (includes everything) | 2 (UI + Backend) |
| **Containers** | 2 (api+ui, worker) | 3 (ui, api, worker) |
| **UI image size** | Large (includes Node.js) | Small (Nginx Alpine) |
| **Worker image** | Includes Nginx + frontend | Backend only |
| **Scale independently** | Partially | Fully |

The monolithic setup (`Dockerfile` + `docker-compose.yml`) still works and is simpler for development. Use the split deployment for production where you want smaller images and independent scaling.
