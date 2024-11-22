# en fait chaque request remplace la data se trouvant a l'URI que l'on donne

# curl --header "X-Vault-Token: ${VAULT_ROOT_TOKEN}" \
curl -k \
     --header "X-Vault-Token: $(cat ../volumes/shared_data/root_token.txt)" \
     --request POST \
     --data '{"API_data": {"api_key": "zizi", "password": "zouzou"}}' \
     https://127.0.0.1:8200/v1/secret/data/logins