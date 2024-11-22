#!/bin/bash

echo "Waiting for Elasticsearch to be ready..."
source /usr/share/kibana/setup/wait-for-elasticsearch.sh

echo "Creating index patterns..."
# Create index pattern for WAF logs
curl -X POST "localhost:5601/api/saved_objects/index-pattern/waf-*" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{"attributes": {"title": "waf-*", "timeFieldName": "@timestamp"}}'

echo "Importing dashboards..."
# Import each dashboard
for dashboard in /usr/share/kibana/dashboards/*.json; do
  echo "Importing $dashboard..."
  curl -X POST "localhost:5601/api/kibana/dashboards/import" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    --data-binary @"$dashboard"
done

echo "Dashboard import complete!"