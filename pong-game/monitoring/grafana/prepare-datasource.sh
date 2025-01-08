#!/bin/bash

# This script reads certificates and creates a properly formatted datasource.yml
CERT_DIR="/etc/grafana/certs"
OUTPUT_FILE="/usr/share/grafana/provisioning/datasources/datasource.yml"

# Create base configuration
cat > ${OUTPUT_FILE} << 'EOL'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: https://prometheus:9090
    jsonData:
      tlsAuth: true
      tlsAuthWithCACert: true
      tlsSkipVerify: false
      timeInterval: "15s"
    secureJsonData:
EOL

# Append certificates with proper indentation
echo "      tlsCACert: |" >> ${OUTPUT_FILE}
sed 's/^/        /' ${CERT_DIR}/ca.crt >> ${OUTPUT_FILE}

echo "      tlsClientCert: |" >> ${OUTPUT_FILE}
sed 's/^/        /' ${CERT_DIR}/grafana.crt >> ${OUTPUT_FILE}

echo "      tlsClientKey: |" >> ${OUTPUT_FILE}
sed 's/^/        /' ${CERT_DIR}/grafana.key >> ${OUTPUT_FILE}

# Add final configuration
cat >> ${OUTPUT_FILE} << 'EOL'
    isDefault: true
    editable: true
EOL

# Set proper permissions
chown grafana-user:grafana-user ${OUTPUT_FILE}
chmod 600 ${OUTPUT_FILE}