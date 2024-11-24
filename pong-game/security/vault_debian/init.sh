#!/bin/bash

# Remove previous init files
rm -rf /vault/file/*
rm -rf /vault/shared_data/*

# Colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
DFT="\033[0m"

VAULT_API_ADDR="https://127.0.0.1:8200"

# Starting vault in the background
vault server -config=/etc/vault.d/vault.hcl &
VAULT_PID=$!

sleep 5

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

# Save root token
echo $ROOT_TOKEN > /vault/shared_data/root_token.txt

echo "${BLUE}Initialization script finished${DFT}"

wait $VAULT_PID