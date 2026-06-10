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
echo "  1. Set HTTPS_ENABLED=true in .env"
echo "  2. bun run dev"
echo "  3. Test with:"
echo "     curl -k --tlsv1.2 --tls-max 1.2 https://localhost:3443/api/docs.json"
echo "     curl -k --tlsv1.3 --tls-max 1.3 https://localhost:3443/api/docs.json"
echo "     curl -k --tlsv1.1 --tls-max 1.1 https://localhost:3443/api/docs.json"
