#!/bin/bash

echo "Creating index templates..."

# Create idividual ILM policies for each index
for TYPE in nginx-access nginx-error waf-audit waf-debug; do
  # Create index templates
  curl -k -X PUT "https://localhost:9200/_template/${TYPE}" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -d "{
      \"index_patterns\": [\"${TYPE}-*\"],
      \"settings\": {
        \"number_of_shards\": 1,
        \"number_of_replicas\": 0,
        \"index.lifecycle.name\": \"${TYPE}_policy\",
        \"index.lifecycle.rollover_alias\": \"${TYPE}\",
        \"index.refresh_interval\": \"30s\"
      },
      \"mappings\": {
        \"properties\": {
          \"@timestamp\": { \"type\": \"date\" },
          \"message\": { \"type\": \"text\" }
        }
      }
    }"

  # Create initial indices with write aliases (always pointing to the newest index. Only one index can be the write at a time)
  curl -k -X PUT "https://localhost:9200/${TYPE}-000001" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -d "{
      \"aliases\": {
        \"${TYPE}\": {
          \"is_write_index\": true
        }
      }
    }"
  
  # Create separate ILM policies for each log type
  curl -k -X PUT "https://localhost:9200/_ilm/policy/${TYPE}_policy" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -d '{
      "policy": {
        "phases": {
          "hot": {
            "actions": {
              "rollover": {
                "max_age": "1d",
                "max_primary_shard_size": "2gb"
              }
            }
          },
          "warm": {
            "min_age": "7d",
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
            "min_age": "14d",
            "actions": {
              "delete": {}
            }
          }
        }
      }
    }'

done

echo "Index templates and lifecycle policies created"