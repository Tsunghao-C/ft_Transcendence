#!/bin/sh
set -e  # fail on error
echo "Starting entrypoint script..."

# Create static directory and set permissions
# mkdir -p /home/app/pong-game/staticfiles && \
mkdir -p /app/static #&& \
chmod -R 755 /app/static

# logs, update filebeat if changing this
mkdir -p logs && chmod -R 755 logs

echo "SQL_PORRT: ${POSTGRES_PORT}"
wait-for-it --service postgres:${POSTGRES_PORT} -- echo "Game Database is ready!"
# wait-for-it --service user_db:${SQL_PORT} -- echo "User Database is ready!"

echo "Waiting for Vault token to be ready..."
echo "Django access token file: ${VAULT_TOKEN_FILE}"
timeout=0
max_timeout=120

until [ -f "${VAULT_TOKEN_FILE}" ] && [ -s "${VAULT_TOKEN_FILE}" ] && grep -q "[a-zA-Z0-9]" "${VAULT_TOKEN_FILE}"; do
    if [ $timeout -ge $max_timeout ]; then
        echo "Timeout waiting for Vault token file fater ${max_timeout} seconds"
        exit 1
    fi
    echo "Waiting for Vault token file to be ready..."
    sleep 5
    timeout=$((timeout + 5))
done
echo "Vault token file is ready, proceeding with migrations"

# echo "Making migrations..."
# python manage.py makemigrations || { echo "makemigrations failed"; exit 1; }

echo "Migrating db's..."
# python manage.py migrate || { echo "migrations failed"; exit 1; }
python manage.py makemigrations user_service
python manage.py makemigrations game_service
python manage.py makemigrations	match_making
python manage.py makemigrations chat
# python manage.py migrate user_service
# python manage.py migrate #game_service
python manage.py migrate user_service
python manage.py migrate game_service
python manage.py migrate match_making
python manage.py migrate chat

echo "Adding django crontab..."
touch /var/log/cron.log
printenv | grep -Ev 'BASHOPTS|BASH_VERSINFO|EUID|PPID|SHELLOPTS|UID|LANG|PWD|GPG_KEY|_=' >> /etc/environment
python manage.py crontab remove
python manage.py crontab add || { echo "failed to add crontab"; exit 1; }
python manage.py crontab show || { echo "failed to show crontab"; exit 1; }
service cron start

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || { echo "static collection failed"; exit 1; }
echo "Static files directory contents:"

# Start Daphne server in the back (WS)
daphne -b 0.0.0.0 -p 8001 backend.asgi:application &

# Start Gunicorn server
echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8004 --workers 3 || { echo "Gunicorn failed"; exit 1; }
