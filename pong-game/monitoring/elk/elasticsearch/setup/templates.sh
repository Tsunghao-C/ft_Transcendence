#!/bin/bash

echo "Creating index templates..."

# Create index template for nginx logs
curl -X PUT "localhost:9200/_template/nginx_logs" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["nginx-*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "index.refresh_interval": "30s",
    "index.translog.durability": "async",
    "index.translog.sync_interval": "30s"
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "remote_addr": { "type": "ip" },
      "request_method": { "type": "keyword" },
      "request": { "type": "text" },
      "status": { "type": "integer" },
      "body_bytes_sent": { "type": "long" },
      "request_time": { "type": "float" },
      "http_referrer": { "type": "keyword" },
      "http_user_agent": { "type": "text" }
    }
  }
}'

# Create index template for WAF logs
curl -X PUT "localhost:9200/_template/waf_logs" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["waf-*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "index.refresh_interval": "30s",
    "index.translog.durability": "async",
    "index.translog.sync_interval": "30s"
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "transaction_id": { "type": "keyword" },
      "client_ip": { "type": "ip" },
      "request_method": { "type": "keyword" },
      "uri": { "type": "text" },
      "severity": { "type": "keyword" },
      "message": { "type": "text" }
    }
  }
}'

echo "Index templates created"