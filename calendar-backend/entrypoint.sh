#!/bin/sh
set -e

# Chờ MySQL sẵn sàng (container tên là cnpm_mysql / service 'db')
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database at ${DB_HOST}:${DB_PORT:-3306}..."
    while ! nc -z "$DB_HOST" "${DB_PORT:-3306}"; do
        sleep 1
    done
    echo "Database is ready."
fi

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000
