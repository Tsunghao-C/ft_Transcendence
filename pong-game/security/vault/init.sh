#!/bin/bash

# Helper function to parse .env
# Colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
DFT="\033[0m"

# This function processes our .env file and stores secrets in Vault
store_env_secrets() {
    echo "${BLUE}Starting to process environment variables...${DFT}"
    
    # Create temporary files to store grouped secrets
    temp_dir=$(mktemp -d)
    
    # Process each line in the .env file
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        case "$line" in
            ""|\#*) continue ;;
        esac

        case "$line" in
            POSTGRES_*)
                echo "$line" >> "$temp_dir/database"
                ;;
            EMAIL_*)
                echo "$line" >> "$temp_dir/email"
                ;;
            ELASTIC_*)
                echo "$line" >> "$temp_dir/elastic"
                ;;
            JWT_*)
                echo "$line" >> "$temp_dir/jwt"
                ;;
            GRAFANA_*)
                echo "$line" >> "$temp_dir/grafana"
                ;;
            PROM_*)
                echo "$line" >> "$temp_dir/prometheus"
                ;;
            PONG_*)
                echo "$line" >> "$temp_dir/admin"
                ;;
        esac
    done < "/vault/.env"
    
    # Process each service file
    for service_file in "$temp_dir"/*; do
        [ -f "$service_file" ] || continue
        
        service=$(basename "$service_file")
        cmd="vault kv put secret/data/pong-game/$service"
        
        # Process each line and add to command
        while IFS='=' read -r key value || [ -n "$key" ]; do
            [ -z "$key" ] && continue
            
            # Clean up key and value
            key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            
            # Handle empty or quoted empty values
            case "$value" in
                '""'|"''"|\"\"|'') value="" ;;
                *) value=$(echo "$value" | sed -e 's/^["\x27]//' -e 's/["\x27]$//') ;;
            esac
            
            # Add to command with proper quoting
            cmd="$cmd $key='$value'"
        done < "$service_file"
        
        # echo "Debug: Executing command: $cmd"
        if eval "$cmd"; then
            echo "${GREEN}Successfully stored secrets for $service${DFT}"
        else
            echo "${RED}Failed to store secrets for $service${DFT}"
        fi
    done
    
    # Clean up temporary files
    rm -rf "$temp_dir"
    echo "${GREEN}Environment variables have been processed and stored in Vault${DFT}"
}

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

# Use helper function to parse env file and add them to secrets categorized by prefix
echo "${BLUE}---------------------- Adding initial secrets ---------------------${DFT}"
store_env_secrets
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

vault policy write django-admin-policy - <<EOF
path "secret/data/pong-game/admin" {
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
    -policy="django-admin-policy" \
    -format=json | jq -r '.auth.client_token')
echo "${BLUE}-------------------------------------------------------------${DFT}"

# Save tokens
echo "${BLUE}---------------------- saving tokens ---------------------${DFT}"
mkdir -p /vault/shared_data/certs
cp /vault/certs/selfsigned.crt /vault/shared_data/certs/
echo $ROOT_TOKEN > /vault/file/root_token.txt
echo $DJANGO_TOKEN > /vault/shared_data/django_token.txt
chmod 600 /vault/shared_data/*.txt
chmod 644 /vault/shared_data/certs/selfsigned.crt
echo "${BLUE}-------------------------------------------------------------${DFT}"

echo "${BLUE}Initialization script finished${DFT}"

wait $VAULT_PID