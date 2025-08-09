#!/bin/bash
# Debug startup script for Railway deployment troubleshooting

set -e  # Exit on any error

echo "🔍 === RAILWAY DEPLOYMENT DEBUG MODE ==="
echo "📅 $(date)"
echo "📍 Current directory: $(pwd)"
echo "👤 User: $(whoami)"
echo "🔧 Python location: $(which python || echo 'python not found')"
echo "🔧 Python3 location: $(which python3 || echo 'python3 not found')"

# Test basic Python
echo "🐍 Testing Python..."
python3 --version || echo "❌ Python3 failed"

# Check environment variables
echo "🌐 Environment variables:"
echo "   PORT: ${PORT:-'not set'}"
echo "   DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo 'SET' || echo 'NOT SET')"
echo "   SECRET_KEY: $([ -n "$SECRET_KEY" ] && echo 'SET' || echo 'NOT SET')"
echo "   ALLOWED_HOSTS: $([ -n "$ALLOWED_HOSTS" ] && echo 'SET' || echo 'NOT SET')"
echo "   DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-'not set'}"

# Check file system
echo "📂 Files in current directory:"
ls -la

echo "📂 Files in /app:"
ls -la /app/ || echo "❌ /app not found"

echo "📂 Checking Django project directory:"
if [ -d "/app/file_upload_project" ]; then
    cd /app/file_upload_project
    echo "✅ Changed to Django project directory: $(pwd)"
    echo "📂 Contents:"
    ls -la
    
    echo "📂 Django settings files:"
    ls -la file_upload_project/settings* || echo "❌ Settings files not found"
else
    echo "❌ Django project directory not found"
fi

# Test different startup approaches
echo ""
echo "🧪 === TESTING STARTUP OPTIONS ==="

# Option 1: Simple health server test
echo "🧪 Testing simple health server..."
timeout 10 python3 /app/simple_health_server.py ${PORT:-8000} &
SERVER_PID=$!
sleep 3

echo "🌐 Testing HTTP connectivity..."
curl -f "http://localhost:${PORT:-8000}/health" || echo "❌ Simple health server test failed"
kill $SERVER_PID 2>/dev/null || true

# Option 2: Test Django settings loading
echo "🧪 Testing Django settings..."
export DJANGO_SETTINGS_MODULE=file_upload_project.settings_production
python3 -c "
import django
import os
print('Django version:', django.get_version())
django.setup()
print('✅ Django settings loaded successfully')
from django.conf import settings
print('✅ Settings accessible')
" || echo "❌ Django settings test failed"

# Option 3: Test Django startup with runserver (for debugging)
echo "🧪 Testing Django development server (5 second test)..."
timeout 5 python3 manage.py runserver 0.0.0.0:${PORT:-8000} --settings=file_upload_project.settings_production || echo "❌ Django runserver test failed"

echo ""
echo "🚀 === ATTEMPTING GUNICORN STARTUP ==="
echo "📍 Current directory: $(pwd)"

# Final attempt: Start Gunicorn with maximum debugging
exec gunicorn \
    --workers 1 \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 300 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug \
    --capture-output \
    --preload \
    file_upload_project.wsgi:application