#!/bin/bash

# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200 >/dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

echo "Elasticsearch is up - initializing..."

# Source other scripts
DIR="$(dirname "${BASH_SOURCE[0]}")"
source "${DIR}/cluster.sh"
source "${DIR}/templates.sh"

echo "Initialization completed"