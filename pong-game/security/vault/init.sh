#!/bin/bash

# Colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
DFT="\033[0m"

# Set environment variables for Vault
export VAULT_ADDR="https://127.0.0.1:8200"
export VAULT_CACERT="/vault/certs/selfsigned.crt"

# Remove previous init files
rm -rf /vault/file/*
rm -rf /vault/shared_data/*

# Starting vault in the background
vault server -config=/etc/vault.d/vault.hcl &
VAULT_PID=$!

# sleep 5
echo "Waiting for Vault to start..."
until curl --cacert $VAULT_CACERT \
        --resolve vault:8200:127.0.0.1 \
        https://vault:8200/v1/sys/health > /dev/null 2>&1; do
    sleep 1
done
echo "Vault server is ready"

# # After initialization, switch to using service name for external access
# VAULT_ADDR="https://vault:8200"

# Initialisation de vault si necessaire
if ! vault status | grep -q "Initialized: true"; then
    echo "${BLUE}---------------------- Initializing Vault -------------------${DFT}"
    vault operator init > /etc/vault.d/init-output.txt
    echo "Vault initialized. Unseal keys and root token saved in /etc/vault.d/init-output.txt"
    echo "${BLUE}-------------------------------------------------------------${DFT}"
fi

# Déverrouillage de Vault si nécessaire
if ! vault status | grep -q "Sealed: false"; then
    echo "${BLUE}---------------------- Unsealing Vault ----------------------${DFT}"
    UNSEAL_KEYS=$(grep 'Unseal Key' /etc/vault.d/init-output.txt | awk '{print $NF}')
    for key in $UNSEAL_KEYS; do
        vault operator unseal -address=${VAULT_ADDR} $key
    done
    echo "${BLUE}-------------------------------------------------------------${DFT}"
fi

# Log in to Vault
ROOT_TOKEN=$(grep 'Initial Root Token' /etc/vault.d/init-output.txt | awk '{print $NF}')
echo "${BLUE}--- Logging into Vault with root token : ${ROOT_TOKEN} ---${DFT}"
vault login -address=${VAULT_ADDR} $ROOT_TOKEN
export VAULT_TOKEN=$ROOT_TOKEN
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Enable KV secrets engine
echo "${BLUE}---------------------- Enabling secrets ---------------------${DFT}"
vault secrets enable -address=${VAULT_ADDR} -path=secret kv
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Hard coded secret credentials here
echo "${BLUE}---------------------- Adding initial secrets ---------------------${DFT}"
vault kv put secret/data/pong-game/database \
    postgres_engine="django.db.backends.postgresql" \
    postgres_host="postgres" \
    postgres_db="transc_db" \
    postgres_user="transc_user" \
    postgres_pass="transc_pass"
vault kv put secret/data/pong-game/email \
    email_host_user="42transcendental@gmail.com" \
    email_host_pass="zlywwbcyedhomdet"
vault kv put secret/data/pong-game/jwt \
    jwt_secret_key="foo"
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Create policy that only allows reading database credentials
echo "${BLUE}---------------------- creating policy ---------------------${DFT}"
vault policy write django-db-policy - <<EOF
path "secret/data/pong-game/database" {
    capabilities = ["read"]
}
EOF

vault policy write django-email-policy - <<EOF
path "secret/data/pong-game/email" {
    capabilities = ["read"]
}
EOF

vault policy write django-jwt-policy - <<EOF
path "secret/data/pong-game/jwt" {
    capabilities = ["read"]
}
EOF
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Create a token for Django with this limited policy
echo "${BLUE}---------------------- Generating tokens ---------------------${DFT}"
DJANGO_TOKEN=$(vault token create \
    -policy="django-db-policy" \
    -policy="django-email-policy" \
    -policy="django-jwt-policy" \
    -format=json | jq -r '.auth.client_token')
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Save tokens
echo "${BLUE}---------------------- saving tokens ---------------------${DFT}"
mkdir -p /vault/shared_data/certs
cp /vault/certs/selfsigned.crt /vault/shared_data/certs/
echo $ROOT_TOKEN > /vault/shared_data/root_token.txt
echo $DJANGO_TOKEN > /vault/shared_data/django_token.txt
chmod 600 /vault/shared_data/*.txt
chmod 644 /vault/shared_data/certs/selfsigned.crt
echo "${BLUE}-------------------------------------------------------------${DFT}"

echo "${BLUE}Initialization script finished${DFT}"

wait $VAULT_PID