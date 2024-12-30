storage "file" {
    path = "/vault/file"
}

listener "tcp" {
    address = "0.0.0.0:8200"
    tls_cert_file = "/vault/certs/selfsigned.crt"
    tls_key_file = "/vault/certs/selfsigned.key"
    tls_min_version = "tls12"
    tls_disable_client_certs = true
}

disable_mlock = true

ui = true

api_addr = "https://vault:8200"
cluster_addr = "https://vault:8201"

log_level = "WARN"