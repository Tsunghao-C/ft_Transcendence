#!/bin/bash

mkdir -p /var/lib/grafana/dashboards/node_exporter_full
# mkdir -p /var/lib/grafana/dashboards/cadvisor

cp -r /provisioning/datasources/* /etc/grafana/provisioning/datasources
cp -r /provisioning/dashboards/* /etc/grafana/provisioning/dashboards
cp -r /provisioning/dashboards/node-export-full/* /var/lib/grafana/dashboards
# cp -r /provisioning/dashboards/cadvisor/* /var/lib/grafana/dashboards

exec "$@"