# Deployment Phase Learnings

## Build Order (dependency chain)
1. shared → tsc -p tsconfig.lib.json && cp package.json dist/
2. pieces-framework → tsc -p tsconfig.lib.json && cp package.json dist/
3. pieces-common → tsc -p tsconfig.lib.json && cp package.json dist/
4. server-common → tsc -p tsconfig.lib.json
5. engine → node esbuild.config.mjs (outputs to dist/packages/engine/main.js)
6. server/api → tsc -p tsconfig.app.json (outputs to packages/server/api/dist/)
7. web → vite build (outputs to dist/packages/web/)

## Entry Point
- Server: `node --enable-source-maps packages/server/api/dist/src/bootstrap.js`
- FLOW_CONTAINER_TYPE controls APP vs WORKER vs WORKER_AND_APP mode

## Nginx
- Upstream uses nginx.react.conf for SPA routing + API proxy to localhost:3000
- Static assets at /usr/share/nginx/html/
