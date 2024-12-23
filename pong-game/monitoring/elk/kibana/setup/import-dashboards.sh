#!/bin/bash

# Wait for Elasticsearch
until curl -s -u "kibana_system:${ELASTICSEARCH_PASSWORD}" http://elasticsearch:9200/_cluster/health >/dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

# Wait for Kibana to be ready
until curl -k -s "https://localhost:5601/api/status" | grep -q '"status":{"overall":{"level":"available"'; do
    echo "Waiting for Kibana..."
    sleep 5
done

# Wait a bit more for Kibana to fully initialize
sleep 5

echo "Elasticsearch and Kibana are up!"

echo "Starting Kibana setup script..."

# Function to create index pattern and return ID
create_index_pattern() {
  local pattern="$1"
  local time_field="$2"

  # echo "Creating index pattern for $pattern..."
  local PATTERN_RESPONSE
  PATTERN_RESPONSE=$(curl -k -X POST "https://localhost:5601/api/saved_objects/index-pattern" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: application/json" \
    -u "elastic:${ELASTICSEARCH_PASSWORD}" \
    -d "{\"attributes\":{\"title\":\"$pattern\",\"timeFieldName\":\"$time_field\"}}")
  
  # Verify creation
  if echo "$PATTERN_RESPONSE" | grep -q "error"; then
      echo "Failed to create pattern: $PATTERN_RESPONSE" >&2
      return 1
  fi

  local PATTERN_ID
  PATTERN_ID=$(echo "$PATTERN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "$PATTERN_ID"
}

# Create and store pattern IDs
echo "Creating index patterns..."
WAF_PATTERN_ID=$(create_index_pattern "waf-*" "@timestamp")
NGINX_PATTERN_ID=$(create_index_pattern "nginx-*" "@timestamp")
# # Add more patterns as needed:
# APP_PATTERN_ID=$(create_index_pattern "app-*" "@timestamp")

# Debug: Verify stored IDs
echo "Stored WAF ID: $WAF_PATTERN_ID"
echo "Stored NGINX ID: $NGINX_PATTERN_ID"

# Process and import all dashboards
TMP_DIR="/tmp/dashboards"
mkdir -p "$TMP_DIR"

for dashboard_dir in /usr/share/kibana/dashboards/*/ ; do
  if [ -d "$dashboard_dir" ]; then
    SERVICE_NAME=$(basename "$dashboard_dir")
    echo "Processing dashboards for service: $SERVICE_NAME"

    # Select appropriate pattern ID based on service
    CURRENT_ID=""
    case $SERVICE_NAME in 
      "waf")
        CURRENT_ID="$WAF_PATTERN_ID"
        ;;
      "nginx")
        CURRENT_ID="$NGINX_PATTERN_ID"
        ;;
      *)
        echo "Unknown service type: $SERVICE_NAME"
        continue
        ;;
    esac

    # Debug: Verify ID before sed
    echo "Using ID for $SERVICE_NAME: $CURRENT_ID"

    # Process all dashboards for this service
    for dashboard in "${dashboard_dir}"*.ndjson; do
      echo "Processing $dashboard..."
      TMP_FILE="$TMP_DIR/temp_dashboard_${SERVICE_NAME}.ndjson"

      # Fixed sed command using different delimiter
      sed "s#INDEX_PATTERN_ID#$CURRENT_ID#g" "$dashboard" > "$TMP_FILE"

      echo "Importing processed dashboard..."
      curl -k -X POST "https://localhost:5601/api/saved_objects/_import?overwrite=true" \
        -H "kbn-xsrf: true" \
        -u "elastic:${ELASTICSEARCH_PASSWORD}" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@$TMP_FILE"
      
      # Clean up
      rm -f "$TMP_FILE"
    done
  fi
done

# # Set up default space view
# echo "Setting up default space view..."
# curl -X PUT "localhost:5601/api/spaces/space/default" \
#     -H "kbn-xsrf: true" \
#     -H "Content-Type: application/json" \
#     -d '{
#     "id": "default",
#     "name": "Default",
#     "disabledFeatures": [],
#     "initials": "D",
#     "_reserved": true
# }'

# # Create default view for Dashboards app
# echo "Setting up default dashboard view..."
# curl -X POST "localhost:5601/api/saved_objects/config/8.16.0" \
#     -H "kbn-xsrf: true" \
#     -H "Content-Type: application/json" \
#     -d "{
#     \"attributes\": {
#         \"defaultRoute\": \"/app/dashboards\",
#         \"defaultIndex\": \"${WAF_PATTERN_ID}\",
#         \"dashboard:defaultDarkMode\": false,
#         \"dashboard:listing:view\": \"list\"
#     }
# }"

# Clean up temporary directory
rm -rf "$TMP_DIR"
echo "Setup complete!"
