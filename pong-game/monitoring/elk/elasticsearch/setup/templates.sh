#!/bin/bash

echo "Creating index templates..."

# Create ILM policy first
curl -k -X PUT "https://localhost:9200/_ilm/policy/logs_lifecycle_policy" \
  -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {
            "rollover": {
              "max_age": "5d",
              "max_primary_shard_size": "2gb"
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

# Create initial nginx index with write alias
curl -k -X PUT "https://localhost:9200/nginx-logs-000001" \
-H "Content-Type: application/json" \
-u "elastic:${ELASTIC_PASSWORD}" \
-d '{
  "aliases": {
    "nginx": {
      "is_write_index": true
    }
  }
}'

# Update your existing nginx template to include lifecycle settings
curl -k -X PUT "https://localhost:9200/_template/nginx_logs" \
  -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
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


# Create initial WAF index with write alias
curl -k -X PUT "https://localhost:9200/waf-logs-000001" \
-H "Content-Type: application/json" \
-u "elastic:${ELASTIC_PASSWORD}" \
-d '{
  "aliases": {
    "waf": {
      "is_write_index": true
    }
  }
}'

# Update WAF template similarly
curl -k -X PUT "https://localhost:9200/_template/waf_logs" \
  -H "Content-Type: application/json" \
  -u "elastic:${ELASTIC_PASSWORD}" \
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