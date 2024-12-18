storage "file" {
    path = "/vault/file"
}

listener "tcp" {
    address = "0.0.0.0:8200"
    tls_cert_file = "/vault/certs/selfsigned.crt"
    tls_key_file = "/vault/certs/selfsigned.key"
}

disable_mlock = true

ui = true