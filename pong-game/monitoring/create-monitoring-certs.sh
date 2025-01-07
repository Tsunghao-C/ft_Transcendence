#!/bin/bash

CERT_DIR="./pong-game/monitoring/certs"
mkdir -p $CERT_DIR

# Create CA
openssl genrsa -out $CERT_DIR/ca.key 4096
openssl req -new -x509 -days 365 -key $CERT_DIR/ca.key \
    -out $CERT_DIR/ca.crt \
    -subj "/CN=monitoring-ca/O=PromGrafana/C=US"

# Create certificates for Prometheus
openssl genrsa -out $CERT_DIR/prometheus.key 2048
openssl req -new -key $CERT_DIR/prometheus.key \
    -out $CERT_DIR/prometheus.csr \
    -subj "/CN=prometheus/O=PromGrafana/C=US"
openssl x509 -req -days 365 -in $CERT_DIR/prometheus.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/prometheus.crt \
    -extfile <(printf "subjectAltName=DNS:prometheus,DNS:localhost")

# Create certificates for Grafana
openssl genrsa -out $CERT_DIR/grafana.key 2048
openssl req -new -key $CERT_DIR/grafana.key \
    -out $CERT_DIR/grafana.csr \
    -subj "/CN=grafana/O=PromGrafana/C=US"
openssl x509 -req -days 365 -in $CERT_DIR/grafana.csr \
    -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial \
    -out $CERT_DIR/grafana.crt \
    -extfile <(printf "subjectAltName=DNS:grafana,DNS:localhost")

rm $CERT_DIR/*.csr

chmod 444 $CERT_DIR/*.key
chmod 644 $CERT_DIR/*.crt