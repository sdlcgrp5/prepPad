#!/bin/bash
# PrepPad Backend Startup Script for Railway Deployment

set -e  # Exit on any error

echo "🚀 Starting PrepPad Backend..."
echo "📍 Current directory: $(pwd)"
echo "🔧 Python version: $(python --version)"
echo "🌐 PORT variable: ${PORT:-8000}"

# Kill any existing processes on the port to prevent conflicts
if [ -n "$PORT" ]; then
    echo "🧹 Cleaning up any processes on port $PORT..."
    pkill -f "gunicorn.*:$PORT" || true
    sleep 2
fi

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

echo "📦 Ensuring static files directory exists..."
mkdir -p /app/file_upload_project/staticfiles
chmod 755 /app/file_upload_project/staticfiles

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

# Verify port is available before starting
PORT_TO_USE=${PORT:-8000}
echo "🔍 Testing port availability on $PORT_TO_USE..."
if netstat -tlnp 2>/dev/null | grep ":$PORT_TO_USE " > /dev/null; then
    echo "⚠️  Port $PORT_TO_USE appears to be in use, attempting cleanup..."
    pkill -f "gunicorn" || true
    sleep 3
fi

echo "🚀 Starting Gunicorn server on 0.0.0.0:$PORT_TO_USE..."
exec gunicorn \
    --workers 1 \
    --bind 0.0.0.0:$PORT_TO_USE \
    --timeout 300 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-class sync \
    --worker-connections 1000 \
    --preload \
    file_upload_project.wsgi:application