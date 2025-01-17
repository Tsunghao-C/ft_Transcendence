#!/bin/bash

## local ssl creation scrip
CERT_DIR="./pong-game/monitoring/elk/certs"
mkdir -p $CERT_DIR

## Generate ELK Certificate Authority (CA)
# Create CA certificate
openssl genrsa -out $CERT_DIR/ca.key 4096
openssl req -new -x509 -days 365 -key $CERT_DIR/ca.key \
    -out $CERT_DIR/ca.crt \
    -subj "/CN=elk-ca/O=Elastic/C=US"

# Create certificates for kibana
# Generate private key
openssl genrsa -out $CERT_DIR/kibana.key 2048
# Generate CSR
openssl req -new -key $CERT_DIR/kibana.key \
    -out $CERT_DIR/kibana.csr \
    -subj "/CN=kibana/O=Elastic/C=US"
# Generate self-signed certificate
openssl x509 -req -days 365 -in $CERT_DIR/kibana.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/kibana.crt

# echo "Kibana SSL certificates generated successfully"

## Generate ELK internal certificates
# Create transport certificates for Elasticsearch
openssl genrsa -out $CERT_DIR/elastic-transport.key 2048
openssl req -new -key $CERT_DIR/elastic-transport.key \
    -out $CERT_DIR/elastic-transport.csr \
    -subj "/CN=elasticsearch/O=Elastic/C=US"

openssl x509 -req -days 365 -in $CERT_DIR/elastic-transport.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/elastic-transport.crt

# Create HTTP certificates for Elasticsearch
openssl genrsa -out $CERT_DIR/elastic-http.key 2048
openssl req -new -key $CERT_DIR/elastic-http.key \
    -out $CERT_DIR/elastic-http.csr \
    -subj "/CN=elasticsearch/O=Elastic/C=US"

openssl x509 -req -days 365 -in $CERT_DIR/elastic-http.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/elastic-http.crt

# Create Logstash certificates
openssl genrsa -out $CERT_DIR/logstash.key 2048
openssl req -new -key $CERT_DIR/logstash.key \
    -out $CERT_DIR/logstash.csr \
    -subj "/CN=logstash/O=Elastic/C=US"
openssl x509 -req -days 365 -in $CERT_DIR/logstash.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/logstash.crt

# Create Filebeat certificates
openssl genrsa -out $CERT_DIR/filebeat.key 2048
openssl req -new -key $CERT_DIR/filebeat.key \
    -out $CERT_DIR/filebeat.csr \
    -subj "/CN=filebeat/O=Elastic/C=US"
openssl x509 -req -days 365 -in $CERT_DIR/filebeat.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/filebeat.crt

rm $CERT_DIR/*.csr

chmod 444 $CERT_DIR/*.key
chmod 644 $CERT_DIR/*.crt

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