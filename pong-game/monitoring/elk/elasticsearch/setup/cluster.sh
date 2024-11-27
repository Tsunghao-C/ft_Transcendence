#!/bin/bash

echo "Configuring cluster settings..."

# Configure cluster settings
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster": {
      "routing": {
        "allocation": {
          "disk.threshold_enabled": true,
          "disk.watermark.low": "85%",
          "disk.watermark.high": "90%",
          "disk.watermark.flood_stage": "95%"
        }
      }
    },
    "action.destructive_requires_name": true
    "indices.lifecycle.poll_interval": "1m"
  }
}'

# Create test index to verify cluster is working
curl -X PUT "localhost:9200/test-index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'

echo "Cluster settings configured"