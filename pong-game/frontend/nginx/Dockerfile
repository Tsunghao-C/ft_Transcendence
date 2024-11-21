FROM nginx:1.27.2

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    libmodsecurity3 \
    libmodsecurity-dev \
    libpcre2-8-0 \
    libpcre2-dev \
    git \
    curl \
    build-essential \
    libpcre3 libpcre3-dev zlib1g zlib1g-dev \
    wget \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and compile ModSecurity for Nginx
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git /tmp/ModSecurity-nginx && \
    wget -qO- https://nginx.org/download/nginx-1.27.2.tar.gz | tar zxv && \
    cd nginx-1.27.2 && \
    ./configure --add-dynamic-module=/tmp/ModSecurity-nginx --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-http_v3_module --with-mail --with-stream --with-stream_realip_module --with-cc-opt='-g -O2 -ffile-prefix-map=/data/builder/debuild/nginx-1.26.2/debian/debuild-base/nginx-1.26.2=. -fstack-protector-strong -Wformat -Werror=format-security -Wp,-D_FORTIFY_SOURCE=2 -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -Wl,--as-needed -pie' && \
    make modules && \
    cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules

# Copy custom nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Download OWASP(Open Web Application Security Project) Core Rule Set
RUN git clone --depth 1 https://github.com/coreruleset/coreruleset.git /etc/nginx/modsecurity-crs && \
    mkdir -p /etc/nginx/modsecurity

# Copy custom modsecurity configuration files
COPY modsecurity.conf /etc/nginx/modsecurity/modsecurity.conf
COPY crs-setup.conf /etc/nginx/modsecurity-crs/crs-setup.conf

# Create ModSecurity log file
RUN touch /var/log/modsec_audit.log && chmod 666 /var/log/modsec_audit.log

# Generate ssl certificate (kept from main)
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O-Organization/CN=localhost"

# # Create a non-root user (safer practice)
# RUN useradd -r -u 1000 nginx-user && \
#     chown -R nginx-user:nginx-user /etc/nginx/ssl && \
#     chown -R nginx-user:nginx-user /etc/nginx/modsecurity && \
#     chown -R nginx-user:nginx-user /var/cache/nginx && \
#     chown -R nginx-user:nginx-user /var/log && \
#     touch /var/run/nginx.pid && \
#     chown -R nginx-user:nginx-user /var/run/nginx.pid

# # Excecute Nginx server as non-root user
# USER nginx-user


# # Set proper permissions for nginx user
# RUN chown -R nginx:nginx /var/cache/nginx && \
#     chown -R nginx:nginx /var/log/nginx && \
#     chown -R nginx:nginx /etc/nginx/ssl && \
#     touch /var/run/nginx.pid && \
#     chown -R nginx:nginx /var/run/nginx.pid

# Exposing HTTP and HTTPS ports
EXPOSE 80 443
