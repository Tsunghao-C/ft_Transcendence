# pull official base image
FROM python:3.11.4-slim-buster
WORKDIR /usr/src/django

# create non-root user
RUN useradd -m -r django_user && \
    chown -R django_user:django_user /usr/src/django

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./backend /usr/src/django/backend
RUN chmod -R 755 /usr/src/django/backend && \
    chown -R django_user:django_user /usr/src/django/backend

USER django_user

CMD sh -c '\
    wait-for-it --service ${SQL_HOST}:${SQL_PORT} -- \
    python /usr/src/django/backend/manage.py makemigrations && \
    python /usr/src/django/backend/manage.py migrate && \
    cd /usr/src/django/backend && \
    gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --log-level debug \
'