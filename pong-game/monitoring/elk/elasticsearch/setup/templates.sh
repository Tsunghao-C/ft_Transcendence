#!/bin/bash

echo "Creating index templates..."

# Create ILM policy first
curl -X PUT -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  "http://localhost:9200/_ilm/policy/logs_lifecycle_policy" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {
            "rollover": {
              "max_age": "5d",
              "max_size": "2GB"
            }
          }
        },
        "warm": {
          "min_age": "14d",
          "actions": {
            "shrink": {
              "number_of_shards": 1
            },
            "forcemerge": {
              "max_num_segments": 1
            }
          }
        },
        "delete": {
          "min_age": "45d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

# Update your existing nginx template to include lifecycle settings
curl -X PUT -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  "http://localhost:9200/_template/nginx_logs" \
  -d '{
    "index_patterns": ["nginx-*"],
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "logs_lifecycle_policy",
      "index.lifecycle.rollover_alias": "nginx",
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

# Update WAF template similarly
curl -X PUT -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  "http://localhost:9200/_template/waf_logs" \
  -d '{
    "index_patterns": ["waf-*"],
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "logs_lifecycle_policy",
      "index.lifecycle.rollover_alias": "waf",
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

echo "Index templates and lifecycle policies created"