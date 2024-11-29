#!/bin/bash

setup_elasticsearch() {
    echo "Starting elasticsearch security setup..."
    
    # First, ensure proper directory structure exists with correct permissions
    mkdir -p /usr/share/elasticsearch/config/certs
    mkdir -p /usr/share/elasticsearch/data
    mkdir -p /usr/share/elasticsearch/logs

    # Set correct ownership for the entire Elasticsearch directory
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch

    # Initialize the keystore before starting Elasticsearch
    if [ ! -f /usr/share/elasticsearch/config/elasticsearch.keystore ]; then
        echo "Creating elasticsearch keystore..."
        su elasticsearch -c "cd /usr/share/elasticsearch && bin/elasticsearch-keystore create -s"
    fi

    # Let Elasticsearch handle certificate creation through autoconfiguration
    export ES_PATH_CONF=/usr/share/elasticsearch/config
    export ES_JAVA_OPTS="-Xms512m -Xmx512m"
    export ELASTIC_PASSWORD=${ELASTIC_PASSWORD:-changeme}

    # Give elasticsearch user full access to its directories
    chmod -R 750 /usr/share/elasticsearch/config
    chmod -R 750 /usr/share/elasticsearch/data
    chmod -R 750 /usr/share/elasticsearch/logs

    echo "Directory permissions and ownership set up complete."
}

# Run setup
setup_elasticsearch

# Run your cluster and ILM setup script
/setup/init.sh &

# Start Elasticsearch as elasticsearch user
exec chroot --skip-chdir --userspec=elasticsearch:elasticsearch / /usr/local/bin/docker-entrypoint.sh "elasticsearch"