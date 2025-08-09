#!/bin/bash
# Railway-Optimized Django Startup Script
# Simplified to work reliably with Railway's container environment

set -e

echo "🚀 [RAILWAY] Starting PrepPad Backend..."
echo "📍 Working Directory: $(pwd)"
echo "🐍 Python Version: $(python --version 2>&1 || python3 --version 2>&1)"
echo "🌐 Port: ${PORT:-8000}"

# Change to Django project directory
cd /app/file_upload_project

# Verify critical environment variables
if [ -z "$SECRET_KEY" ]; then
    echo "❌ [RAILWAY] SECRET_KEY environment variable is required"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ [RAILWAY] DATABASE_URL environment variable is required"
    exit 1
fi

echo "✅ [RAILWAY] Environment variables validated"

# Create required directories
echo "📁 [RAILWAY] Creating required directories..."
mkdir -p /app/file_upload_project/staticfiles
mkdir -p /app/file_upload_project/media

# Run Django management commands
echo "🔧 [RAILWAY] Running Django setup..."

# Database migrations
echo "📋 [RAILWAY] Running database migrations..."
python manage.py migrate --settings=file_upload_project.settings_production --noinput || {
    echo "❌ [RAILWAY] Database migrations failed"
    exit 1
}

# Collect static files
echo "📦 [RAILWAY] Collecting static files..."
python manage.py collectstatic --settings=file_upload_project.settings_production --noinput --clear || {
    echo "❌ [RAILWAY] Static files collection failed"
    exit 1
}

# Quick Django check
echo "🏥 [RAILWAY] Running Django system check..."
python manage.py check --settings=file_upload_project.settings_production || {
    echo "❌ [RAILWAY] Django system check failed"
    exit 1
}

# Start Gunicorn with Railway-optimized settings
echo "🚀 [RAILWAY] Starting Gunicorn server..."
echo "🔗 [RAILWAY] Binding to 0.0.0.0:${PORT:-8000}"

# Verify WSGI application is available
python -c "
import sys
import os
sys.path.insert(0, '/app/file_upload_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
try:
    from file_upload_project.wsgi import application
    print('✅ [RAILWAY] WSGI application loaded successfully')
except Exception as e:
    print(f'❌ [RAILWAY] WSGI application load failed: {e}')
    sys.exit(1)
"

# Final gunicorn startup
exec gunicorn \
    --workers 1 \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --keep-alive 5 \
    --worker-class sync \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --preload \
    file_upload_project.wsgi:application