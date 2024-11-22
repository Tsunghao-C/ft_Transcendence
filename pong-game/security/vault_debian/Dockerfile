# Utilisation de l'image de base Debian
FROM debian:latest

# Variables d'environnement pour Vault
ENV VAULT_VERSION=1.18.1
ENV VAULT_SHA256SUM=d6486e4644cbeefa841ff6a41e39b68a5129c329bd2e271b29368948ff9ddfc4
ENV VAULT_ADDR=http://127.0.0.1:8200

# Mise à jour du système et installation des dépendances nécessaires
RUN apt-get update && apt-get install -y \
    wget \
	curl \
    unzip \
    vim \
    ca-certificates \
    gnupg \
	openssl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Téléchargement et vérification de Vault
RUN wget https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip \
    && echo "${VAULT_SHA256SUM} vault_${VAULT_VERSION}_linux_amd64.zip" | sha256sum -c - \
    && unzip vault_${VAULT_VERSION}_linux_amd64.zip \
    && mv vault /usr/local/bin/ \
    && chmod +x /usr/local/bin/vault \
    && rm vault_${VAULT_VERSION}_linux_amd64.zip

# Création d'un utilisateur non-root pour exécuter Vault
RUN useradd --no-create-home --shell /bin/false vault

# Configuration de Vault
RUN mkdir -p /etc/vault.d /var/lib/vault \
    && chown -R vault:vault /etc/vault.d /var/lib/vault

# Ajout des fichiers de configuration de Vault
COPY vault.hcl /etc/vault.d/vault.hcl
RUN chown vault:vault /etc/vault.d/vault.hcl

RUN mkdir -p /vault/file /vault/data && \
    chown -R vault:vault /vault/file /vault/data

# Génération des certificats auto-signés
RUN mkdir -p /vault/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /vault/certs/selfsigned.key \
    -out /vault/certs/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" && \
    chown -R vault:vault /vault/certs/selfsigned.crt /vault/certs/selfsigned.key

COPY init_inside.sh /init_inside.sh
RUN chown -R vault:vault /init_inside.sh

RUN mkdir /vault/shared_data
RUN chown -R vault:vault /vault/shared_data

# Honestly might as well
RUN chown -R vault:vault /vault/

RUN mkdir -p /home/vault
RUN chown -R vault:vault /home/vault

# Déclaration des ports et configuration de l'utilisateur par défaut
EXPOSE 8200
USER vault

STOPSIGNAL SIGINT

ENTRYPOINT ["sh", "./init_inside.sh"]