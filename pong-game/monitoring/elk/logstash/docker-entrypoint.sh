set -e

cat /tmp/logstash.yml > /usr/share/logstash/config/logstash.yml

chmod 644 /usr/share/logstash/config/logstash.yml

# rm /tmp/logstash.yml

exec /usr/local/bin/docker-entrypoint