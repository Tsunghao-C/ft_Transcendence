FROM owasp/modsecurity-crs:nginx

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --chmod=644 nginx/default.conf /etc/nginx/conf.d/
COPY --chmod=644 rules/custom.conf /etc/modsecurity.d/rules/

USER root

RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp \
    && chmod 755 /var/cache/nginx \
    && chmod -R 755 /var/cache/nginx/* \
    && chown -R nginx:nginx /var/cache/nginx

COPY --chmod=644 nginx/nginx.conf /etc/nginx/nginx.conf

USER nginx

CMD [ "nginx", "-g", "daemon off;" ]