FROM golang:1.17-alpine AS builder

ENV NODE_EXPORTER_VERSION="1.3.1"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Download and build node_exporter
RUN git clone --branch v$NODE_EXPORTER_VERSION https://github.com/prometheus/node_exporter.git && \
    cd node_exporter && \
    go build .

FROM alpine:3.15

# Copy the built binary from builder stage
COPY --from=builder /app/node_exporter/node_exporter /usr/local/bin/node_exporter

# Set up node_exporter user and switch to user for security
RUN adduser -D node_exporter
USER node_exporter

EXPOSE 9100

ENTRYPOINT [ "/usr/local/bin/node_exporter" ]