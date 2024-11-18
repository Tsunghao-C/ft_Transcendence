#!/bin/sh
set -e  # fail on error
echo "Starting entrypoint script..."

# Create static directory and set permissions
mkdir -p /app/static && \
chmod -R 755 /app/static

echo "Waiting for database to be ready..."
echo "SQL_HOST: ${SQL_HOST}, SQL_PORT: ${SQL_PORT}"
wait-for-it --service ${SQL_HOST}:${SQL_PORT} -- echo "Database is ready!"

echo "Applying database migrations..."
echo "Running makemigrations..."
python manage.py makemigrations || { echo "makemigrations failed"; exit 1; }

echo "Running migrate..."
python manage.py migrate || { echo "migrate failed"; exit 1; }

echo "Collecting static files..."
# Add verbose flag and print directory contents
python manage.py collectstatic --noinput -v 2 || { echo "static collection failed"; exit 1; }
echo "Static files directory contents:"
ls -la /app/static

echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8004 || { echo "Gunicorn failed"; exit 1; }