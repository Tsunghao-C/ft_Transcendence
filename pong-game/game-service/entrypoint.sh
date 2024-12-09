#!/bin/sh
set -e  # fail on error
echo "Starting entrypoint script..."

# Create static directory and set permissions
# mkdir -p /home/app/pong-game/staticfiles && \
mkdir -p /app/static #&& \
chmod -R 755 /app/static

echo "Waiting for database to be ready..."
echo "SQL_PORT: ${SQL_PORT}"
wait-for-it --service game_db:${SQL_PORT} -- echo "Game Database is ready!"
# wait-for-it --service user_db:${SQL_PORT} -- echo "User Database is ready!"

# echo "Making migrations..."
# python manage.py makemigrations || { echo "makemigrations failed"; exit 1; }

echo "Migrating db's..."
# python manage.py migrate || { echo "migrations failed"; exit 1; }
python manage.py makemigrations user_service
python manage.py makemigrations game_service
python manage.py migrate user_service
python manage.py migrate game_service
# python manage.py migrate user_service --database=default
# python manage.py migrate game_service --database=game_db


echo "Adding django crontab..."
python manage.py crontab add || { echo "failed to add crontab"; exit 1; }

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput -v 2 || { echo "static collection failed"; exit 1; }
echo "Static files directory contents:"

# Start cron service
echo "Starting cron service..."
service cron start || { echo "failed to start cron service"; exit 1; }

# Start Gunicorn server
echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8004 --workers 3 || { echo "Gunicorn failed"; exit 1; }
