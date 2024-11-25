#!/bin/bash

# Wait for Elasticsearch
until curl -s http://elasticsearch:9200 >/dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

echo "Elasticsearch is up!"

# Wait for Kibana
until curl -s http://localhost:5601/api/status >/dev/null; do
    echo "Waiting for Kibana..."
    sleep 5
done

echo "Kibana is up!"

# Wait a bit more for Kibana to fully initialize
sleep 10

# Create index pattern (only if it doesn't exist)
echo "Creating index pattern..."
PATTERN_RESPONSE=$(curl -X POST "localhost:5601/kibana/api/saved_objects/index-pattern" \
    -H "kbn-xsrf: true" \
    -H "Content-Type: application/json" \
    -d '{"attributes":{"title":"waf-*","timeFieldName":"@timestamp"}}')

PATTERN_ID=$(echo $PATTERN_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created index pattern with ID: $PATTERN_ID"

# Process and import all dashboards
TMP_DIR="/tmp/dashboards/tmp"
mkdir -p $TMP_DIR

for dashboard in /usr/share/kibana/dashboards/*.ndjson; do
  echo "Processing $dashboard..."
  TMP_FILE="$TMP_DIR/temp_dashboard.ndjson"
  
  # Replace the index pattern ID
  sed "s/INDEX_PATTERN_ID/$PATTERN_ID/g" "$dashboard" > "$TMP_FILE"
  
  echo "Importing processed dashboard..."
  curl -X POST "localhost:5601/kibana/api/saved_objects/_import?overwrite=true" \
       -H "kbn-xsrf: true" \
       -H "Content-Type: multipart/form-data" \
       -F "file=@$TMP_FILE"
  # Clean up
  rm -f "$TMP_FILE"
done

# # Set up default space view
# echo "Setting up default space view..."
# curl -X PUT "localhost:5601/kibana/api/spaces/space/default" \
#     -H "kbn-xsrf: true" \
#     -H "Content-Type: application/json" \
#     -d '{
#       "id": "default",
#       "name": "Default",
#       "disabledFeatures": [],
#       "initials": "D",
#       "_reserved": true,
#       "defaultRoute": "/app/dashboards"
#     }'

# # Create default view for Dashboards app
# echo "Setting up default dashboard view..."
# curl -X POST "localhost:5601/kibana/api/saved_objects/config/8.16.0" \
#     -H "kbn-xsrf: true" \
#     -H "Content-Type: application/json" \
#     -d '{
#       "attributes": {
#         "defaultRoute": "/app/dashboards",
#         "defaultIndex": "'$PATTERN_ID'",
#         "dashboard:defaultDarkMode": false,
#         "dashboard:listing:view": "list"
#       }
#     }'

# Clean up temporary directory
rm -rf $TMP_DIR

echo "Setup complete!"
