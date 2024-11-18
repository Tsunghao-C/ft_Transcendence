FROM nginx:alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Create necessary directories with correct permissions
USER root
RUN mkdir -p /tmp/nginx \
    && mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp \
    && chmod 755 /var/cache/nginx \
    && chmod -R 755 /var/cache/nginx/* \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /tmp/nginx

# Copy configurations with correct permissions
COPY --chmod=644 nginx.conf /etc/nginx/nginx.conf
COPY --chmod=644 default.conf /etc/nginx/conf.d/

# Switch to non-root user
USER nginx

CMD ["nginx", "-g", "daemon off;"]

# RUN apk add --no-cache openssl

# RUN mkdir -p /etc/nginx/certs

# RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout /etc/nginx/certs/privkey.pem \
#     -out /etc/nginx/certs/fullchain.pem \
#     -subj "/C=US/ST=State/L=City/O-Organization/CN=localhost" \
#     && chmod 644 /etc/nginx/certs/fullchain.pem \
#     && chmod 644 /etc/nginx/certs/privkey.pem

# COPY default.conf /etc/nginx/conf.d/default.conf

# RUN adduser -D -H -u 1000 nginx-user && \
#     chown -R nginx-user:nginx-user /etc/nginx/certs && \
#     chown -R nginx-user:nginx-user /var/cache/nginx && \
#     chown -R nginx-user:nginx-user /var/log/nginx && \
#     touch /var/run/nginx.pid && \
#     chown -R nginx-user:nginx-user /var/run/nginx.pid

# USER nginx-user

# EXPOSE 80 443
