#!/bin/bash

# Wait for Elasticsearch
until curl -s -k -u "kibana_system:${ELASTICSEARCH_PASSWORD}" https://elasticsearch:9200/_cluster/health >/dev/null; do
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


# Process and import all dashboards
TMP_DIR="/tmp/dashboards"
mkdir -p "$TMP_DIR"

# # [Important] If you create dashboard from kibana UI and export, then only update the following for loop
for dashboard_dir in /usr/share/kibana/dashboards/*/ ; do
  if [ -d "$dashboard_dir" ]; then
    SERVICE_NAME=$(basename "$dashboard_dir")
    echo "Processing dashboards for service: $SERVICE_NAME"

    # Process all dashboards for this service
    for dashboard in "${dashboard_dir}"*.ndjson; do
      echo "Processing $dashboard..."
      TMP_FILE="$TMP_DIR/temp_dashboard_${SERVICE_NAME}.ndjson"

      # Use sed command to replace macros, like changing correct pattern ID to temp file
      # sed "s#INDEX_PATTERN_ID#$CURRENT_ID#g" "$dashboard" > "$TMP_FILE"

      # Or just copy to tmp file (avoid permission issue) by using cat command
      cat "$dashboard" > "$TMP_FILE"

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
