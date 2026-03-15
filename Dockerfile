FROM node:20-bullseye-slim AS base

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        openssh-client \
        python3 \
        g++ \
        build-essential \
        git \
        procps \
        locales \
        curl \
        ca-certificates && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen en_US.UTF-8

### STAGE 1: Build ###
FROM base AS build

WORKDIR /usr/src/app

# Copy package files first for layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.lib.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/pieces/framework/package.json packages/pieces/framework/tsconfig.lib.json packages/pieces/framework/tsconfig.json ./packages/pieces/framework/
COPY packages/pieces/common/package.json packages/pieces/common/tsconfig.lib.json packages/pieces/common/tsconfig.json ./packages/pieces/common/
COPY packages/server/common/package.json packages/server/common/tsconfig.lib.json packages/server/common/tsconfig.json ./packages/server/common/
COPY packages/server/engine/package.json ./packages/server/engine/
COPY packages/server/api/package.json packages/server/api/tsconfig.json packages/server/api/tsconfig.app.json ./packages/server/api/
COPY packages/server/tsconfig.server.json ./packages/server/
COPY packages/web/package.json packages/web/tsconfig.json packages/web/tsconfig.node.json packages/web/vite.config.mts ./packages/web/

# Install all dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps 2>&1 | tail -5

# Copy all source code
COPY packages/ ./packages/

# Build shared packages in dependency order
RUN cd packages/shared && npm run build
RUN cd packages/pieces/framework && npm run build
RUN cd packages/pieces/common && npm run build
RUN cd packages/server/common && npm run build

# Build engine (esbuild bundle)
RUN cd packages/server/engine && npm run build

# Build server API
RUN cd packages/server/api && npm run build

# Build web frontend
RUN cd packages/web && npm run build

### STAGE 2: Run ###
FROM base AS run

WORKDIR /usr/src/app

# Install Nginx
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends nginx gettext

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Copy package files and install production deps
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/package-lock.json ./
COPY --from=build /usr/src/app/packages/shared/package.json ./packages/shared/
COPY --from=build /usr/src/app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=build /usr/src/app/packages/pieces/framework/package.json ./packages/pieces/framework/
COPY --from=build /usr/src/app/packages/pieces/framework/dist/ ./packages/pieces/framework/dist/
COPY --from=build /usr/src/app/packages/pieces/common/package.json ./packages/pieces/common/
COPY --from=build /usr/src/app/packages/pieces/common/dist/ ./packages/pieces/common/dist/
COPY --from=build /usr/src/app/packages/server/common/package.json ./packages/server/common/
COPY --from=build /usr/src/app/packages/server/common/dist/ ./packages/server/common/dist/
COPY --from=build /usr/src/app/packages/server/engine/package.json ./packages/server/engine/
COPY --from=build /usr/src/app/packages/server/api/package.json ./packages/server/api/

# Copy built server API
COPY --from=build /usr/src/app/packages/server/api/dist/ ./packages/server/api/dist/

# Copy built engine
COPY --from=build /usr/src/app/dist/packages/engine/ ./dist/packages/engine/

# Copy piece packages (runtime needs them for piece loading)
COPY --from=build /usr/src/app/packages/pieces/ ./packages/pieces/

# Install production dependencies only
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --omit=dev 2>&1 | tail -5

# Copy frontend build to nginx
COPY --from=build /usr/src/app/dist/packages/web/ /usr/share/nginx/html/

# Create engine dist directory
RUN mkdir -p /usr/src/app/dist/packages/engine

LABEL service=flow

ENTRYPOINT ["./docker-entrypoint.sh"]
EXPOSE 80
