#!/bin/bash

echo "Setting up HTTPS for local development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "Installing mkcert..."
    brew install mkcert
fi

# Install local CA
echo "Installing local Certificate Authority..."
mkcert -install

# Create certs directory
mkdir -p apps/api/certs

# Generate certificates
echo "Generating SSL certificates for localhost..."
cd apps/api/certs
mkcert localhost 127.0.0.1 ::1

echo "✅ SSL certificates created successfully!"
echo "Certificates are in: apps/api/certs/"
echo ""
echo "Next steps:"
echo "1. Update your NestJS main.ts to use HTTPS"
echo "2. Restart your dev server"
