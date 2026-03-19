.PHONY: dev dev-db dev-db-stop dev-stop dev-backend dev-frontend dev-install dev-build-deps \
       db-upgrade db-downgrade db-generate db-current db-history db-check db-reset db-create-collation

API_DIR = packages/server/api
TYPEORM = cd $(API_DIR) && node_modules/.bin/ts-node --transpile-only -r tsconfig-paths/register -P tsconfig.app.json node_modules/typeorm/cli.js
DB_ENV = set -a && . ./.env.production && set +a && \
	export FLOW_POSTGRES_HOST=localhost FLOW_POSTGRES_PORT=5434 \
	FLOW_ENVIRONMENT=dev FLOW_EDITION=ce &&

## Start everything: databases + backend + frontend
## Ctrl+C kills all child processes cleanly
dev: dev-db dev-build-deps
	@echo "Starting backend and frontend..."
	@trap 'trap - INT TERM EXIT; echo ""; echo "Shutting down..."; kill 0; wait 2>/dev/null' INT TERM EXIT; \
		set -a && . ./.env.production && set +a && \
		FLOW_POSTGRES_HOST=localhost FLOW_POSTGRES_PORT=5434 \
		FLOW_REDIS_HOST=localhost FLOW_REDIS_PORT=6381 \
		FLOW_FRONTEND_URL=http://localhost:4200 \
		FLOW_WEBHOOK_URL=http://localhost:3000 \
		FLOW_ENVIRONMENT=dev \
		npx tsx watch \
			--exclude 'packages/pieces/**' \
			--exclude 'packages/**/dist/**' \
			--tsconfig packages/server/api/tsconfig.app.json \
			packages/server/api/src/bootstrap.ts & \
		BACKEND_PID=$$!; \
		cd packages/web && npx vite & \
		FRONTEND_PID=$$!; \
		echo "Backend PID: $$BACKEND_PID, Frontend PID: $$FRONTEND_PID"; \
		wait

## Start only Postgres, Redis, and Vault containers
dev-db:
	docker compose up -d postgres redis vault
	@echo "Waiting for services to be healthy..."
	@until docker compose exec postgres pg_isready -U flow -q 2>/dev/null; do \
		echo "Waiting for Postgres..."; sleep 2; \
	done
	@until docker compose exec redis redis-cli ping > /dev/null 2>&1; do \
		echo "Waiting for Redis..."; sleep 2; \
	done
	@until docker compose exec vault vault status 2>/dev/null | grep -q 'Sealed.*false'; do \
		echo "Waiting for Vault..."; sleep 2; \
	done
	@echo "Bootstrapping Vault..."
	@docker compose exec vault sh -c '\
		export VAULT_ADDR=http://127.0.0.1:8200 && \
		export VAULT_TOKEN=dev-root-token && \
		vault secrets disable secret 2>/dev/null; \
		vault secrets enable -path=secret -version=1 kv && \
		vault auth enable userpass 2>/dev/null; \
		vault write auth/userpass/users/flow password=flow-dev-password policies=flow-policy; \
		echo "path \"secret/*\" { capabilities = [\"create\",\"read\",\"update\",\"delete\",\"list\"] }" | vault policy write flow-policy -; \
		echo "Vault ready"'
	@echo "Services are ready (Postgres on :5434, Redis on :6381, Vault on :8200)"

## Stop the database containers
dev-db-stop:
	docker compose down

## Stop everything: kill dev processes on known ports + stop databases
dev-stop:
	@echo "Stopping dev processes..."
	@-fuser -k 3000/tcp 2>/dev/null && echo "Killed backend (port 3000)" || true
	@-fuser -k 4200/tcp 2>/dev/null && echo "Killed frontend (port 4200)" || true
	@docker compose down
	@echo "All stopped."

## Run the API server with hot-reload (port 3000)
dev-backend:
	@echo "Starting backend on port 3000..."
	@set -a && . ./.env.production && set +a && \
		FLOW_POSTGRES_HOST=localhost FLOW_POSTGRES_PORT=5434 \
		FLOW_REDIS_HOST=localhost FLOW_REDIS_PORT=6381 \
		FLOW_FRONTEND_URL=http://localhost:4200 \
		FLOW_WEBHOOK_URL=http://localhost:3000 \
		FLOW_ENVIRONMENT=dev \
		npx tsx watch \
		--exclude 'packages/pieces/**' \
		--exclude 'packages/**/dist/**' \
		--tsconfig packages/server/api/tsconfig.app.json \
		packages/server/api/src/bootstrap.ts

## Run the Vite dev server (port 4200)
dev-frontend:
	@echo "Starting frontend on port 4200..."
	@cd packages/web && npx vite

## Install npm dependencies (one-time setup)
dev-install:
	npm install --legacy-peer-deps
	cd packages/shared && npm install --legacy-peer-deps
	cd packages/web && npm install --legacy-peer-deps
	cd packages/server/api && npm install --legacy-peer-deps
	cd packages/server/engine && npm install --legacy-peer-deps
	cd packages/server/worker && npm install --legacy-peer-deps
	cd packages/server/common && npm install --legacy-peer-deps

## Build shared libs that the server needs at runtime
dev-build-deps:
	@echo "Building shared dependencies..."
	cd packages/shared && npm run build
	cd packages/server/engine && npm run build
	@echo "All dependencies built."

# ─── Database Migration Commands (alembic-style) ───────────────────────

## Run all pending migrations (like alembic upgrade head)
db-upgrade:
	@$(DB_ENV) $(TYPEORM) migration:run -d src/app/database/migration-data-source.ts

## Revert the last migration (like alembic downgrade -1)
db-downgrade:
	@$(DB_ENV) $(TYPEORM) migration:revert -d src/app/database/migration-data-source.ts

## Auto-generate a migration from entity changes (like alembic revision --autogenerate)
## Usage: make db-generate name=AddUserAvatar
db-generate:
	@if [ -z "$(name)" ]; then echo "Usage: make db-generate name=MigrationName"; exit 1; fi
	@$(DB_ENV) $(TYPEORM) migration:generate -p -d src/app/database/migration-data-source.ts src/app/database/migration/postgres/$(name)
	@echo ""
	@echo "Migration generated. Don't forget to import it in postgres-connection.ts getMigrations()"

## Show which migrations have been applied (like alembic current)
db-current:
	@$(DB_ENV) $(TYPEORM) migration:show -d src/app/database/migration-data-source.ts

## Check for schema drift — fails if entities don't match DB (like alembic check)
db-check:
	@$(DB_ENV) $(TYPEORM) migration:generate -p -d src/app/database/migration-data-source.ts src/app/database/migration/postgres/Check --dryrun --check \
		&& echo "No schema drift detected." \
		|| (echo "Schema drift detected! Run: make db-generate name=FixDrift" && exit 1)

## Drop and recreate the database, then run all migrations
db-reset:
	@echo "Dropping and recreating database..."
	@PGPASSWORD=flow psql -h localhost -p 5434 -U flow -d postgres -c "DROP DATABASE IF EXISTS flow;"
	@PGPASSWORD=flow psql -h localhost -p 5434 -U flow -d postgres -c "CREATE DATABASE flow;"
	@$(MAKE) db-create-collation
	@$(MAKE) db-upgrade
	@echo "Database reset complete."

## Create the en_natural collation (required before first migration)
db-create-collation:
	@PGPASSWORD=flow psql -h localhost -p 5434 -U flow -d flow -c \
		"CREATE COLLATION IF NOT EXISTS en_natural (provider = icu, locale = 'en-u-kn-true');" 2>/dev/null
