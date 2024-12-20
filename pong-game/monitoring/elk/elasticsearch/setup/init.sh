#!/bin/bash

# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200 >/dev/null; do
    echo "Waiting for Elasticsearch to be ready..."
    sleep 5
done

echo "Elasticsearch is up - initializing..."

echo "Setting up built-in users..."

# Set up elastic superuser password
echo "Setting elastic superuser password..."
curl -X POST -H "Content-Type: application/json" \
     "http://localhost:9200/_security/user/elastic/_password" \
     -d "{\"password\":\"${ELASTIC_PASSWORD}\"}"

# Verify elastic user credentials
echo "Verifying elastic user..."
if curl -s -u "elastic:${ELASTIC_PASSWORD}" http://localhost:9200/_security/_authenticate > /dev/null; then
    echo "Elastic superuser verified successfully"
else
    echo "Failed to verify elastic user"
    exit 1
fi

# Set up kibana_system user with proper auth
echo "Setting kibana_system user password..."
curl -X POST -H "Content-Type: application/json" \
     -u "elastic:${ELASTIC_PASSWORD}" \
     "http://localhost:9200/_security/user/kibana_system/_password" \
     -d "{\"password\":\"${ELASTIC_PASSWORD}\"}"

echo "Verifying kibana_system user..."
if curl -s -u "kibana_system:${ELASTIC_PASSWORD}" http://localhost:9200/_security/_authenticate; then
     echo "Kibana system user verified successfully"
else
     echo "Failed to verify kibana system user"
     exit 1
fi

echo "User setup complete"

# Source other scripts
DIR="$(dirname "${BASH_SOURCE[0]}")"
source "${DIR}/cluster.sh"
source "${DIR}/templates.sh"

echo "Initialization completed"