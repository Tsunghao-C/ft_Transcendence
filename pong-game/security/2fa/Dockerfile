FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

ENV FLASK_APP=src/app.py
ENV FLASK_ENV=development
ENV PORT=8082

# EXPOSE 8082

CMD ["gunicorn", "--bind", "0.0.0.0:8082", "--workers", "4", "src.app:app"]


# CMD [ "python", "src/app.py" ]

USER 1000