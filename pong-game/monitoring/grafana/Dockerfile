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

COPY startup.sh /startup.sh

RUN chmod +x /startup.sh

EXPOSE 3000

ENTRYPOINT [ "/startup.sh" ]

CMD [ "grafana-server", "--homepath=/usr/share/grafana", "--config=/grafana.ini" ]