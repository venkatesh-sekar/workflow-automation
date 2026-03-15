#!/bin/sh

# Start Nginx server (for APP and WORKER_AND_APP modes)
if [ "$FLOW_CONTAINER_TYPE" = "WORKER" ]; then
    echo "Starting Flow worker..."
    node --enable-source-maps packages/server/api/dist/src/bootstrap.js
else
    echo "Starting nginx..."
    nginx -g "daemon off;" &

    echo "Starting Flow server..."
    node --enable-source-maps packages/server/api/dist/src/bootstrap.js
fi
