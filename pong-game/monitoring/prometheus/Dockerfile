FROM debian:bullseye

RUN apt-get update && \
    apt-get install -y openssl curl && \
    rm -rf /var/lib/apt/lists/*

# Download Prometheus
RUN curl -LO https://github.com/prometheus/prometheus/releases/download/v2.32.1/prometheus-2.32.1.linux-amd64.tar.gz && \
    tar xvf prometheus-2.32.1.linux-amd64.tar.gz && \
    mv prometheus-2.32.1.linux-amd64 /prometheus && \
    rm prometheus-2.32.1.linux-amd64.tar.gz

RUN mkdir -p /prometheus/data

COPY ./conf/prometheus.yml /prometheus/
COPY ./conf/web-config.yml /prometheus/
COPY ./conf/alert.rules /prometheus/

RUN mkdir -p /etc/prometheus/certs

RUN useradd -r -u 1000 prometheus-user && \
    chown -R prometheus-user:prometheus-user /etc/prometheus && \
    chown -R prometheus-user:prometheus-user /prometheus && \
    chown -R prometheus-user:prometheus-user /var/log && \
    chown -R prometheus-user:prometheus-user /var/cache && \
    chown -R prometheus-user:prometheus-user /usr/share

USER prometheus-user

EXPOSE 9090

WORKDIR /prometheus

ENTRYPOINT [ "/prometheus/prometheus", \
    "--config.file=/prometheus/prometheus.yml", \
    "--web.config.file=/prometheus/web-config.yml", \
    "--storage.tsdb.path=/prometheus/data", \
    "--storage.tsdb.retention.time=7d", \
    "--storage.tsdb.retention.size=2GB" ]
