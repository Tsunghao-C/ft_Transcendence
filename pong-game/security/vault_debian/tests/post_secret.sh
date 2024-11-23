# Every request replaces the data located at the given URI

curl -k \
     --header "X-Vault-Token: $(cat ../volumes/shared_data/root_token.txt)" \
     --request POST \
     --data '{"Data_title": {"name_key": "name_value", "password_key": "password_value"}}' \
     https://127.0.0.1:8200/v1/secret/data/logins