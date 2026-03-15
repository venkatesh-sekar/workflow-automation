.PHONY: dev dev-db dev-db-stop dev-backend dev-frontend dev-install dev-build-deps

## Start everything: databases + backend + frontend
dev: dev-db dev-build-deps
	@echo "Starting backend and frontend..."
	@$(MAKE) dev-backend &
	@$(MAKE) dev-frontend &
	@wait

## Start only Postgres and Redis containers
dev-db:
	docker compose up -d postgres redis
	@echo "Waiting for databases to be healthy..."
	@docker compose exec postgres pg_isready -U flow -q || \
		(echo "Waiting for Postgres..." && sleep 5)
	@docker compose exec redis redis-cli ping > /dev/null || \
		(echo "Waiting for Redis..." && sleep 5)
	@echo "Databases are ready (Postgres on :5434, Redis on :6381)"

## Stop the database containers
dev-db-stop:
	docker compose down

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
	@cd packages/web && npm run serve

## Install npm dependencies (one-time setup)
dev-install:
	npm install

## Build shared libs that the server needs at runtime
dev-build-deps:
	@echo "Building shared dependencies..."
	cd packages/shared && npm run build
	cd packages/pieces/framework && npm run build
	cd packages/pieces/common && npm run build
	cd packages/server/common && npm run build
	cd packages/server/engine && npm run build
	@echo "All dependencies built."
