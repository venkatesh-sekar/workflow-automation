# Flow MVP Design

Internal workflow automation tool forked from Activepieces v0.79.2. Strips away public SaaS features, keeps the core automation engine with AI agent capabilities.

## Authentication & Teams

### Model
- 1 API key = 1 project = 1 team
- API keys stored encrypted in `project` table (using existing encryption infrastructure)
- Project members linked by email, flat (no roles)
- API keys never visible in the UI

### Auth Flow
1. User visits app, frontend checks localStorage for JWT
2. No token: show "Enter your email and team key" prompt
3. Frontend POSTs `{ email, apiKey }` to `POST /api/v1/auth/team-login`
4. Backend: find project by API key -> check email exists as member -> return JWT scoped to project
5. JWT stored in localStorage, sent as `Authorization: Bearer` header
6. All existing project-scoped middleware works as-is (JWT contains `projectId`)

### Admin Operations (CLI scripts, no admin UI)
- `create-team` — creates project + generates encrypted API key, prints key to stdout
- `add-member` — adds email to a project's members
- `rotate-key` — generates new API key for a project, existing sessions remain valid until JWT expires

## Backend Changes

### Authentication Module (`/server/api/src/app/authentication/`)
- Remove: signup, signin, password reset, OAuth callbacks
- Add: single `POST /api/v1/auth/team-login` endpoint
- Keep: JWT token generation (`access-token-manager`) as-is
- Remove: `user-identity` service/entity (no passwords)

### Pieces Registry
Keep 24 pieces total:

**Core (22):**
HTTP, Code, Branches/Conditions, Loops, Data Mapper, Math Helper, CSV, File Helper, Image Helper, PDF, Delay, Approval, Forms, Manual Trigger, Schedule, Store, GraphQL, SMTP, SFTP, Data Summarizer, Connections, Text Helper

**Community (2):**
Slack, Postgres

**Removed from core:**
Crypto, QR Code

**Removed entirely:**
All 600+ community pieces except Slack and Postgres

### AI Module (`/server/api/src/app/ai/`)
- Keep: AI provider entity and service
- Strip providers to OpenAI only (remove Anthropic, Google, Azure, OpenRouter, Cloudflare)
- Keep: full MCP server implementation as-is
- Keep: full agents system as-is

### Audit Logs
- Build from scratch as new core module (do NOT copy from ee/ — proprietary code)
- New entity: audit_event with columns: id, projectId, userId, event, data, timestamp
- New service + controller with project-scoped list endpoint
- Log: flow create/update/delete, connection changes, member changes, flow enable/disable

### Alerts
- Build a simple alerts module from scratch (do NOT copy from ee/alerts — proprietary code)
- Replace with structured stdout logging on flow failure
- Format: `{ level: 'error', event: 'flow_failed', flowId, projectId, error, timestamp }`
- Keep alert service interface for future swappability (Slack, email, webhook)

### Templates
- Keep the core (non-EE) template module only
- Strip OFFICIAL type (cloud-fetched)
- Keep CUSTOM type
- Add scope field: `TEAM` (project-scoped) or `GLOBAL` (visible to all teams)
- Any template code in ee/ must NOT be copied — build scope logic from scratch

### EE Code Policy
**Do NOT copy, reference, or import ANY file from `packages/ee/` or `packages/server/api/src/app/ee/`.** These directories contain proprietary Activepieces Enterprise Edition code (not MIT-licensed). Any functionality we need must be written from scratch. During the copy phases, skip the entire `ee/` tree. During fix-references, remove or stub out any imports that point to `ee/` paths.

### Remove These Backend Modules (non-EE)
- `tables/` (entire module)
- Any imports/references to the above EE paths must be deleted or replaced with our own implementations

### Keep Untouched
- Flow engine, workers, job queue
- Triggers system (webhook, schedule, polling)
- Connections/credentials system
- Webhooks
- File storage
- Store entries (key-value)

### Environment Variable Rebrand
Global rename of `AP_` prefix to `FLOW_` across:
- `AppSystemProp` / `WorkerSystemProp` enum values
- `system.ts` env var reader and defaults
- Docker Compose `.env` and `docker-compose.yml`
- All hardcoded `AP_` references

Examples:
- `AP_CONTAINER_TYPE` -> `FLOW_CONTAINER_TYPE`
- `AP_POSTGRES_HOST` -> `FLOW_POSTGRES_HOST`
- `AP_ENCRYPTION_KEY` -> `FLOW_ENCRYPTION_KEY`
- `AP_JWT_SECRET` -> `FLOW_JWT_SECRET`
- `AP_EXECUTION_MODE` -> `FLOW_EXECUTION_MODE`
- `AP_FLOW_WORKER_CONCURRENCY` -> `FLOW_WORKER_CONCURRENCY`

## Frontend Changes

### New: Key Entry Screen
- Replace `/sign-in` and `/sign-up` with single `/login` page
- Two fields: email, team key
- Red-branded, "Flow" logo
- On success: store JWT in localStorage, redirect to `/automations`

### Sidebar (keep)
- Automations (flows list)
- Connections
- Runs (execution history)
- Agents/Chat
- Templates
- Settings

### Sidebar (remove)
- Tables
- Leaderboard/Community
- Platform admin
- Billing/Plans

### Settings Page (simplify)
- Keep: General (project name, icon)
- Keep: Team members (list emails, add/remove)
- Keep: Alerts (placeholder, "check application logs")
- Remove: Billing, API keys, Git sync, Custom domains, Appearance (i18n)

### Branding
- App name: "Flow" — replace in page titles, sidebar header, meta tags, favicon
- Primary color: red — swap in Tailwind theme config
- Replace Activepieces logo with "Flow" wordmark or placeholder

### No Changes
- Flow builder UI
- Agents/Chat UI
- Connections management UI
- Runs/logs viewer

## Deployment

### Docker Compose (5 containers)

```yaml
services:
  flow-api:
    image: flow:latest
    environment:
      FLOW_CONTAINER_TYPE: APP
    ports:
      - "3000:3000"

  flow-worker:
    image: flow:latest
    environment:
      FLOW_CONTAINER_TYPE: WORKER
      FLOW_WORKER_CONCURRENCY: 10
    deploy:
      replicas: 1  # scale as needed

  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

### Scaling
- Workers scale horizontally: add more `flow-worker` replicas
- API scales horizontally: put multiple `flow-api` behind load balancer (stateless, JWT auth)
- Bottleneck is Postgres/Redis (single instance handles ~95 req/sec on modest hardware)

### Key Environment Variables
```env
FLOW_CONTAINER_TYPE=WORKER_AND_APP  # or APP / WORKER
FLOW_POSTGRES_DATABASE=flow
FLOW_POSTGRES_HOST=postgres
FLOW_POSTGRES_PORT=5432
FLOW_REDIS_HOST=redis
FLOW_REDIS_PORT=6379
FLOW_ENCRYPTION_KEY=<256-bit hex>
FLOW_JWT_SECRET=<secret>
FLOW_EXECUTION_MODE=UNSANDBOXED
FLOW_WORKER_CONCURRENCY=10
FLOW_LOG_LEVEL=info
```

## Database Changes

### Modified Tables
- `project`: add `api_key` column (encrypted string, unique)
- `template`: add `scope` column (enum: `TEAM`, `GLOBAL`)

### Removed Tables
- `user_identity`
- `platform` and all platform-related tables
- `table`, `field`, `record`, `cell` (Tables feature)
- EE-specific tables (never created since we don't copy EE code): `project_role`, `project_plan`, `signing_key`, `custom_domain`, `oauth_app`, `api_key`

### Kept As-Is
- `user`, `project`, `project_member`
- `flow`, `flow_version`, `flow_run`, `folder`
- `app_connection`, `trigger_source`, `trigger_event`
- `file`, `store_entry`
- `audit_event`

## What This Preserves From Activepieces

- Complete flow builder and execution engine
- BullMQ job queue with horizontal worker scaling
- All trigger types (webhook, schedule, polling)
- OAuth2/API key credential management
- Project-scoped data isolation
- JWT-based authorization middleware
- AI agents with MCP tools
- Template system for flow reuse
