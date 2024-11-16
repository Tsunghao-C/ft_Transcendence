# pull official base image
FROM python:3.11.4-slim-buster

WORKDIR /usr/src/django

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./backend /usr/src/django/backend

RUN chmod -R 755 /usr/src/django/backend

USER root

# need to change the wait-for-it command to use env vars
CMD ["sh", "-c", "wait-for-it --service db:5432 -- python /usr/src/django/backend/manage.py makemigrations && python /usr/src/django/backend/manage.py migrate && python /usr/src/django/backend/manage.py runserver 0.0.0.0:8000"]
