FROM debian:bullseye

RUN apt-get update && \
    apt-get install -y curl gnupg bash && \
    curl https://packages.grafana.com/gpg.key | apt-key add - && \
    echo "deb https://packages.grafana.com/oss/deb stable main" > /etc/apt/sources.list.d/grafana.list && \
    apt-get update && \
    apt-get install -y grafana && \
    rm -rf /var/lib/apt/lists/*

COPY grafana.ini /grafana.ini

RUN cp -r /usr/share/grafana/conf/provisioning /provisioning

COPY provisioning /provisioning

RUN cp -r /provisioning/datasources/* /etc/grafana/provisioning/datasources && \
    cp -r /provisioning/dashboards/* /etc/grafana/provisioning/dashboards

# Generate ssl certificate (kept from main)
RUN mkdir -p /etc/grafana/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/grafana/certs/grafana.key \
    -out /etc/grafana/certs/grafana.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=grafana"

RUN useradd -r -u 1000 grafana-user && \
    chown -R grafana-user:grafana-user /etc/grafana/certs && \
    chown -R grafana-user:grafana-user /etc/grafana/provisioning && \
    chown -R grafana-user:grafana-user /etc/grafana && \
    chown -R grafana-user:grafana-user /var/lib && \
    chown -R grafana-user:grafana-user /var/log && \
    chown -R grafana-user:grafana-user /var/cache && \
    chown -R grafana-user:grafana-user /usr/share/grafana 

USER grafana-user

EXPOSE 3000

ENTRYPOINT [ "grafana-server", "--homepath=/usr/share/grafana", "--config=/grafana.ini" ]