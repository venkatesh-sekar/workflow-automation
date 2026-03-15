#!/bin/sh
set -e

# Default API URL if not provided
export FLOW_API_URL="${FLOW_API_URL:-http://flow-api:3000}"

echo "Configuring nginx to proxy API requests to: $FLOW_API_URL"

# Substitute environment variables in nginx config
envsubst '${FLOW_API_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Starting nginx..."
exec nginx -g "daemon off;"
