#!/bin/bash
# PrepPad Backend Startup Script for Railway Deployment

set -e  # Exit on any error

echo "🚀 Starting PrepPad Backend..."
echo "📍 Current directory: $(pwd)"
echo "🔧 Python version: $(python --version)"
echo "🌐 PORT variable: ${PORT:-8000}"

# Change to Django project directory
cd /app/file_upload_project
echo "📍 Changed to Django project directory: $(pwd)"

# Check if settings file exists
if [ ! -f "file_upload_project/settings_production.py" ]; then
    echo "❌ Production settings file not found!"
    exit 1
fi

# Check environment variables
echo "🔍 Checking critical environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    exit 1
fi
if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY is not set!"
    exit 1
fi
echo "✅ Critical environment variables are set"

echo "📋 Running database migrations..."
python manage.py migrate --settings=file_upload_project.settings_production --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --settings=file_upload_project.settings_production --noinput --clear

echo "🏥 Running Django deployment checks..."
python manage.py check --deploy --settings=file_upload_project.settings_production

echo "🧪 Testing health endpoint availability..."
python -c "
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
django.setup()
from file_upload.views_health import health_check
print('✅ Health endpoint is importable')
"

echo "🚀 Starting Gunicorn server on 0.0.0.0:${PORT:-8000}..."
exec gunicorn \
    --workers 3 \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --preload \
    file_upload_project.wsgi:application