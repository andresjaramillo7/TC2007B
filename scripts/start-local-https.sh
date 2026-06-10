#!/usr/bin/env bash
set -euo pipefail

KEY=".local-certs/localhost-key.pem"
CERT=".local-certs/localhost-cert.pem"

if [ ! -f "$KEY" ] || [ ! -f "$CERT" ]; then
  echo "Local TLS certificates were not found."
  echo ""
  echo "Run:"
  echo "  bun run cert"
  echo ""
  echo "Then start the backend with:"
  echo "  bun run dev"
  exit 1
fi

echo "Local TLS certificates found."
echo "Starting Grade Tracker API with HTTPS..."

HTTPS_PORT=3443 \
TLS_KEY_PATH="$KEY" \
TLS_CERT_PATH="$CERT" \
bun --watch src/server.ts
