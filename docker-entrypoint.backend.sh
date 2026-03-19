#!/bin/sh
set -e

if [ "$FLOW_CONTAINER_TYPE" = "WORKER" ]; then
    echo "Starting Flow worker..."
else
    echo "Starting Flow API server..."
fi

exec node --enable-source-maps packages/server/api/dist/main.js
