#!/bin/sh
set -e

# Add server/api node_modules to NODE_PATH so piece packages can resolve deps
export NODE_PATH="/usr/src/app/packages/server/api/node_modules:${NODE_PATH:-}"

if [ "$FLOW_CONTAINER_TYPE" = "WORKER" ]; then
    echo "Starting Flow worker..."
else
    echo "Starting Flow API server..."
fi

exec node --enable-source-maps packages/server/api/dist/src/bootstrap.js
