#!/bin/sh
set -e  # fail on error
echo "Starting entrypoint script..."

# Create static directory and set permissions
# mkdir -p /home/app/pong-game/staticfiles && \
mkdir -p /app/static #&& \
chmod -R 755 /app/static

echo "Waiting for database to be ready..."
echo "SQL_PORT: ${POSTGRES_PORT}"
wait-for-it --service postgres:${POSTGRES_PORT} -- echo "Game Database is ready!"
# wait-for-it --service user_db:${SQL_PORT} -- echo "User Database is ready!"

# echo "Making migrations..."
# python manage.py makemigrations || { echo "makemigrations failed"; exit 1; }

echo "Migrating db's..."
# python manage.py migrate || { echo "migrations failed"; exit 1; }
python manage.py makemigrations user_service
python manage.py makemigrations game_service
# python manage.py migrate user_service
# python manage.py migrate #game_service
python manage.py migrate user_service
python manage.py migrate game_service

echo "Adding django crontab..."
python manage.py crontab remove
python manage.py crontab add || { echo "failed to add crontab"; exit 1; }
python manage.py crontab show || { echo "failed to show crontab"; exit 1; }
service cron start

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || { echo "static collection failed"; exit 1; }
echo "Static files directory contents:"

# Start Gunicorn server
echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8004 --workers 3 || { echo "Gunicorn failed"; exit 1; }
