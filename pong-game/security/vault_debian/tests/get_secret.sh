# en fait chaque request remplace la data se trouvant a l'URI que l'on donne

curl -k --header "X-Vault-Token: $(cat ../volumes/shared_data/root_token.txt)" \
     https://127.0.0.1:8200/v1/secret/data/logins