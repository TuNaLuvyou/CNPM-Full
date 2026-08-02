# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    pkg-config \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Run migrations and start the server
CMD ["sh", "-c", "if [ -n \"$DB_HOST\" ]; then while ! nc -z \"$DB_HOST\" \"${DB_PORT:-5432}\"; do sleep 1; done; fi; python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
