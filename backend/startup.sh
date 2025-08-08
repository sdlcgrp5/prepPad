#!/bin/bash
# PrepPad Backend Startup Script for Railway Deployment

set -e  # Exit on any error

echo "🚀 Starting PrepPad Backend..."

# Change to Django project directory
cd /app/file_upload_project

echo "📋 Running database migrations..."
python manage.py migrate --settings=file_upload_project.settings_production --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --settings=file_upload_project.settings_production --noinput --clear

echo "🏥 Checking health..."
python manage.py check --deploy --settings=file_upload_project.settings_production

echo "🚀 Starting Gunicorn server..."
exec gunicorn \
    --workers 3 \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --keepalive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    file_upload_project.wsgi:application