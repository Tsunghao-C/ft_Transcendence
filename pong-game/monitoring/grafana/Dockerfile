FROM debian:bullseye

RUN apt-get update && \
    apt-get install -y curl gnupg bash && \
    curl https://packages.grafana.com/gpg.key | apt-key add - && \
    echo "deb https://packages.grafana.com/oss/deb stable main" > /etc/apt/sources.list.d/grafana.list && \
    apt-get update && \
    apt-get install -y grafana && \
    rm -rf /var/lib/apt/lists/*

COPY grafana.ini /grafana.ini

COPY prepare-datasource.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/prepare-datasource.sh

COPY provisioning /usr/share/grafana/provisioning

RUN mkdir -p /etc/grafana/certs

RUN useradd -r -u 1000 grafana-user && \
    chown -R grafana-user:grafana-user /etc/grafana/certs && \
    chown -R grafana-user:grafana-user /etc/grafana && \
    chown -R grafana-user:grafana-user /var/lib && \
    chown -R grafana-user:grafana-user /var/log && \
    chown -R grafana-user:grafana-user /var/cache && \
    chown -R grafana-user:grafana-user /usr/share/grafana 

USER grafana-user

EXPOSE 3000

ENTRYPOINT [ "/bin/bash", "-c", "/usr/local/bin/prepare-datasource.sh && grafana-server --homepath=/usr/share/grafana --config=/grafana.ini" ]