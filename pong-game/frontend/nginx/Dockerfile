FROM nginx:1.27.2

COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy other resources
# COPY ... ...

WORKDIR /usr/share/nginx/html

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O-Organization/CN=localhost"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
