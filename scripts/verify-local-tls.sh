#!/usr/bin/env bash
set -euo pipefail

BASE="https://localhost:3443/api/docs.json"
PASS=true

if curl -sk --tlsv1.2 --tls-max 1.2 "$BASE" > /dev/null 2>&1; then
  echo "✓ TLS 1.2 accepted"
else
  echo "✗ TLS 1.2 rejected (expected accepted)"
  PASS=false
fi

if curl -sk --tlsv1.3 --tls-max 1.3 "$BASE" > /dev/null 2>&1; then
  echo "✓ TLS 1.3 accepted"
else
  echo "✗ TLS 1.3 rejected (expected accepted)"
  PASS=false
fi

if curl -sk --tlsv1.1 --tls-max 1.1 "$BASE" > /dev/null 2>&1; then
  echo "✗ TLS 1.1 accepted (expected rejected)"
  PASS=false
else
  echo "✓ TLS 1.1 correctly rejected"
fi

if [ "$PASS" = false ]; then
  exit 1
fi
