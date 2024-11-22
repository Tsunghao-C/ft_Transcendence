#!/bin/bash

until curl -s http://elasticsearch:9200 > /dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

echo "Elasticsearch is up!"

# Wait for Kibana to be ready
until curl -s http://localhost:5601/api/status > /dev/null; do
    echo "Waiting for Kibana..."
    sleep 5
done

echo "Kibana is up!"