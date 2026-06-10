#!/usr/bin/env bash
set -euo pipefail

DIR=".local-certs"
KEY="$DIR/localhost-key.pem"
CERT="$DIR/localhost-cert.pem"

if [ -f "$KEY" ] || [ -f "$CERT" ]; then
  echo "WARNING: Certificate files already exist in $DIR/"
  echo "Delete them first if you want to regenerate."
  exit 1
fi

mkdir -p "$DIR"

openssl req -x509 \
  -newkey rsa:2048 \
  -sha256 \
  -days 365 \
  -nodes \
  -keyout "$KEY" \
  -out "$CERT" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo ""
echo "Local self-signed certificate generated."
echo "  Key:  $KEY"
echo "  Cert: $CERT"
echo ""
echo "Next steps:"
echo "  1. Start the backend:"
echo "     bun run dev"
echo ""
echo "  2. Verify TLS:"
echo "     bun run tls"
