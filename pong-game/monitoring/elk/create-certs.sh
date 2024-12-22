#!/bin/bash

## local ssl creation scrip
CERT_DIR="./pong-game/monitoring/elk/certs"
mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/kibana.key 2048

# Generate CSR
openssl req -new -key $CERT_DIR/kibana.key -out $CERT_DIR/kibana.csr -subj "/CN=kibana"

# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/kibana.csr \
    -signkey $CERT_DIR/kibana.key -out $CERT_DIR/kibana.crt

rm $CERT_DIR/kibana.csr

# Set proper permissions
chmod 444 $CERT_DIR/kibana.key
chmod 444 $CERT_DIR/kibana.crt

echo "SSL certificates generated successfully"

## Auto ssl creation script
# CERT_DIR="/usr/share/kibana/config/certs"
# mkdir -p $CERT_DIR


# if [ ! -f "$CERT_DIR/kibana.key" ] || [ ! -f "$CERT_DIR/kibana.crt" ]; then
#     echo "Generating SSL certificatese..."
    
#     # Generate private key
#     openssl genrsa -out $CERT_DIR/kibana.key 2048

#     # Generate CSR
#     openssl req -new -key $CERT_DIR/kibana.key -out $CERT_DIR/kibana.csr -subj "/CN=kibana"

#     # Generate selfsigned certificate
#     openssl x509 -req -days 365 -in $CERT_DIR/kibana.csr \
#         -signkey $CERT_DIR/kibana.key -out $CERT_DIR/kibana.crt

#     rm $CERT_DIR/kibana.csr

#     # Set proper permissions
#     chmod 400 $CERT_DIR/kibana.key
#     chmod 444 $CERT_DIR/kibana.crt

#     echo "SSL certificates generated successfully"
# else
#     echo "SSL certificates already exist, skipping generation"
# fi