#!/bin/bash

# Generate SSL certificates for HTTPS support
echo "🔐 Generating SSL certificates for HTTPS support..."

# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificates saved to: ssl/cert.pem and ssl/key.pem"
echo "🔒 These are self-signed certificates for development use"
echo ""
echo "⚠️  Note: Browsers will show a security warning for self-signed certificates"
echo "   Click 'Advanced' → 'Proceed to localhost (unsafe)' to continue"
