FROM nginx:stable

RUN apt-get update && apt-get install -y \
    openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/privkey.pem \
    -out /etc/nginx/certs/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O-Organization/CN=localhost" && \
    chmod 644 /etc/nginx/certs/fullchain.pem && \
    chmod 644 /etc/nginx/certs/privkey.pem

COPY default.conf /etc/nginx/conf.d/default.conf

RUN useradd -r -u 1000 nginx-user && \
    chown -R nginx-user:nginx-user /etc/nginx/certs && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

EXPOSE 80 443