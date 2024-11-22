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


# Cleanup function
cleanup() {
    echo "${RED}Stopping Vault server and cleaning up...${DFT}"
    pkill -f "vault server" || echo "${RED}Vault server already stopped.${DFT}"
    rm -rf /vault/file/*
    echo "${GREEN}Cleanup complete.${DFT}"
    exit 0
}

# Cleanup activates on SIGTERM and SIGINT signal
trap cleanup SIGTERM SIGINT

# Starting vault in the background
vault server -config=/etc/vault.d/vault.hcl &
VAULT_PID=$!

sleep 5

# Initialisation de vault si necessaire
if ! vault status | grep -q "Initialized: true"; then
    echo "Initializing Vault..."
    vault operator init > /etc/vault.d/init-output.txt
    echo "Vault initialized. Unseal keys and root token saved in /etc/vault.d/init-output.txt"
fi

# Déverrouillage de Vault si nécessaire
if ! vault status | grep -q "Sealed: false"; then
    echo "${BLUE}Unsealing Vault...${DFT}"
    UNSEAL_KEYS=$(grep 'Unseal Key' /etc/vault.d/init-output.txt | awk '{print $NF}')
    for key in $UNSEAL_KEYS; do
        vault operator unseal -address=${VAULT_ADDR} $key
    done
    echo "${GREEN}Vault is unsealed and ready.${DFT}"
fi

# Log in to Vault
ROOT_TOKEN=$(grep 'Initial Root Token' /etc/vault.d/init-output.txt | awk '{print $NF}')
echo "${BLUE}Logging into Vault with root token : ${ROOT_TOKEN}...${DFT}"
vault login -address=${VAULT_ADDR} $ROOT_TOKEN
export VAULT_TOKEN=$ROOT_TOKEN
echo "${GREEN}Logged in to vault with root token${DFT}"

# Enable KV secrets engine
echo "${BLUE}Enabling KV secrets engine at path 'secret'... ${DFT}"
vault secrets enable -address=${VAULT_ADDR} -path=secret kv
echo "${GREEN}KV secrets engine enabled!${DFT}"

# Save root token
echo $ROOT_TOKEN > /vault/shared_data/root_token.txt
echo "${GREEN}Initialization complete. Root token saved to /vault/shared_data/root_token.txt.${DFT}"

wait $VAULT_PID
# sleep infinity

#######################################################3


# # Attendre que Vault soit prêt
# until curl -k --silent --fail https://127.0.0.1:8200/v1/sys/init | grep -q '"initialized":true'; do
#   echo "Waiting for Vault to initialize..."
#   sleep 2
# done

# echo -e "${GREEN}||||||||||||||||| Starting Vault Script |||||||||||||||||${DFT}"

# echo "${BLUE}----- vault status -----${DFT}"
# vault status -address=https://127.0.0.1:8200
# echo "${BLUE}------------------------${DFT}"

# # Initialisation
# if vault status -address=https://127.0.0.1:8200 | grep -q 'Sealed *true'; then
#     echo "Initializing Vault..."
#     vault operator init -address=${VAULT_ADDR} -key-shares=3 -key-threshold=2 > /vault/shared_data/init.txt
#     echo "Vault initialized!"
# else
#     echo "Vault is already initialized."
# fi

# # Unseal Vault
# echo "Unsealing Vault..."
# UNSEAL_KEYS=$(grep 'Unseal Key' /vault/shared_data/init.txt | awk '{print $NF}')
# for key in $UNSEAL_KEYS; do
#     vault operator unseal -address=${VAULT_ADDR} $key
# done

# # Log in to Vault
# ROOT_TOKEN=$(grep 'Initial Root Token' /vault/shared_data/init.txt | awk '{print $NF}')
# echo "Logging into Vault with root token..."
# vault login -address=${VAULT_ADDR} $ROOT_TOKEN
# export VAULT_TOKEN=$ROOT_TOKEN

# # Enable KV secrets engine
# echo "Enabling KV secrets engine at path 'secret'..."
# vault secrets enable -address=${VAULT_ADDR} -path=secret kv
# echo -e "${GREEN}KV secrets engine enabled!${DFT}"

# # Save root token
# echo $ROOT_TOKEN > /vault/shared_data/ROOT_TOKEN_FILE.txt
# echo -e "${GREEN}Initialization complete. Root token saved to /vault/shared_data/ROOT_TOKEN_FILE.txt.${DFT}"

# # vault server -config=/vault/config/vault.hcl
#  sleep infinity