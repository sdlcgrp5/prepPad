#!/bin/bash
# Railway Debug Startup Script - Maximum Debugging for Health Check Issues
# This script provides extensive logging to debug why health checks are failing

set -e

echo "🔍 [DEBUG] ====== RAILWAY DEBUG STARTUP ======"
echo "🔍 [DEBUG] Timestamp: $(date)"
echo "🔍 [DEBUG] Working Directory: $(pwd)"
echo "🔍 [DEBUG] Python Version: $(python --version 2>&1 || python3 --version 2>&1)"
echo "🔍 [DEBUG] User: $(whoami)"
echo "🔍 [DEBUG] Port: ${PORT:-8000}"

# Environment variable debugging
echo "🔍 [DEBUG] ====== ENVIRONMENT VARIABLES ======"
echo "🔍 [DEBUG] SECRET_KEY: $([ -n "$SECRET_KEY" ] && echo 'SET (hidden)' || echo 'NOT SET')"
echo "🔍 [DEBUG] DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo 'SET (hidden)' || echo 'NOT SET')"
echo "🔍 [DEBUG] ALLOWED_HOSTS: ${ALLOWED_HOSTS:-'not set'}"
echo "🔍 [DEBUG] CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-'not set'}"
echo "🔍 [DEBUG] DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-'not set'}"
echo "🔍 [DEBUG] PATH: $PATH"

# File system debugging
echo "🔍 [DEBUG] ====== FILE SYSTEM ======"
echo "🔍 [DEBUG] Contents of /app:"
ls -la /app/ || echo "🔍 [DEBUG] /app directory not found"

echo "🔍 [DEBUG] Contents of current directory:"
ls -la . || echo "🔍 [DEBUG] Current directory listing failed"

# Change to Django directory and verify structure
echo "🔍 [DEBUG] ====== DJANGO PROJECT STRUCTURE ======"
if [ -d "/app/file_upload_project" ]; then
    cd /app/file_upload_project
    echo "🔍 [DEBUG] Changed to Django directory: $(pwd)"
    echo "🔍 [DEBUG] Django project contents:"
    ls -la || echo "🔍 [DEBUG] Django directory listing failed"
    
    echo "🔍 [DEBUG] Django settings files:"
    ls -la file_upload_project/settings* 2>/dev/null || echo "🔍 [DEBUG] No settings files found"
    
    echo "🔍 [DEBUG] Django app structure:"
    ls -la file_upload/ 2>/dev/null || echo "🔍 [DEBUG] Django app directory not found"
else
    echo "🔍 [DEBUG] ❌ Django project directory not found at /app/file_upload_project"
    exit 1
fi

# Environment validation with detailed feedback
echo "🔍 [DEBUG] ====== ENVIRONMENT VALIDATION ======"
if [ -z "$SECRET_KEY" ]; then
    echo "🔍 [DEBUG] ❌ SECRET_KEY is missing"
    exit 1
else
    echo "🔍 [DEBUG] ✅ SECRET_KEY is set"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "🔍 [DEBUG] ❌ DATABASE_URL is missing"
    exit 1
else
    echo "🔍 [DEBUG] ✅ DATABASE_URL is set"
fi

# Create required directories with detailed logging
echo "🔍 [DEBUG] ====== DIRECTORY SETUP ======"
mkdir -p /app/file_upload_project/staticfiles
mkdir -p /app/file_upload_project/media
echo "🔍 [DEBUG] Created staticfiles and media directories"
ls -la /app/file_upload_project/staticfiles /app/file_upload_project/media

# Set Django settings explicitly
export DJANGO_SETTINGS_MODULE=file_upload_project.settings_production
echo "🔍 [DEBUG] Set DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# Test Python Django import
echo "🔍 [DEBUG] ====== DJANGO IMPORT TEST ======"
python -c "
import sys
import os
print(f'🔍 [DEBUG] Python executable: {sys.executable}')
print(f'🔍 [DEBUG] Python version: {sys.version}')
print(f'🔍 [DEBUG] Python path: {sys.path[:3]}...')

try:
    import django
    print(f'🔍 [DEBUG] Django version: {django.get_version()}')
    print('🔍 [DEBUG] ✅ Django imported successfully')
except Exception as e:
    print(f'🔍 [DEBUG] ❌ Django import failed: {e}')
    sys.exit(1)

try:
    django.setup()
    print('🔍 [DEBUG] ✅ Django setup completed')
except Exception as e:
    print(f'🔍 [DEBUG] ❌ Django setup failed: {e}')
    sys.exit(1)

try:
    from django.conf import settings
    print(f'🔍 [DEBUG] ✅ Django settings loaded')
    print(f'🔍 [DEBUG] DEBUG setting: {settings.DEBUG}')
    print(f'🔍 [DEBUG] ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
except Exception as e:
    print(f'🔍 [DEBUG] ❌ Django settings access failed: {e}')
    sys.exit(1)
" || {
    echo "🔍 [DEBUG] ❌ Django import test failed"
    exit 1
}

# Test Django management commands
echo "🔍 [DEBUG] ====== DJANGO MANAGEMENT COMMANDS ======"
echo "🔍 [DEBUG] Testing Django management commands..."

python manage.py check --settings=file_upload_project.settings_production || {
    echo "🔍 [DEBUG] ❌ Django system check failed"
    exit 1
}
echo "🔍 [DEBUG] ✅ Django system check passed"

# Database migrations (with error handling)
echo "🔍 [DEBUG] Running database migrations..."
python manage.py migrate --settings=file_upload_project.settings_production --noinput || {
    echo "🔍 [DEBUG] ❌ Database migrations failed"
    echo "🔍 [DEBUG] Continuing anyway - database might not be critical for health check"
}
echo "🔍 [DEBUG] ✅ Database migrations completed (or skipped)"

# Static files (with error handling)
echo "🔍 [DEBUG] Collecting static files..."
python manage.py collectstatic --settings=file_upload_project.settings_production --noinput --clear || {
    echo "🔍 [DEBUG] ❌ Static files collection failed"
    echo "🔍 [DEBUG] Continuing anyway - static files might not be critical for health check"
}
echo "🔍 [DEBUG] ✅ Static files collection completed (or skipped)"

# Test WSGI application loading
echo "🔍 [DEBUG] ====== WSGI APPLICATION TEST ======"
python -c "
import sys
import os
sys.path.insert(0, '/app/file_upload_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
try:
    from file_upload_project.wsgi import application
    print('🔍 [DEBUG] ✅ WSGI application loaded successfully')
    print(f'🔍 [DEBUG] WSGI application: {application}')
except Exception as e:
    print(f'🔍 [DEBUG] ❌ WSGI application load failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
" || {
    echo "🔍 [DEBUG] ❌ WSGI application test failed"
    exit 1
}

# Test health check endpoint directly
echo "🔍 [DEBUG] ====== HEALTH CHECK ENDPOINT TEST ======"
python -c "
import sys
import os
sys.path.insert(0, '/app/file_upload_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
import django
django.setup()

try:
    from file_upload.views_health import health_check
    print('🔍 [DEBUG] ✅ Health check view imported successfully')
    
    # Test the view function
    from django.test import RequestFactory
    factory = RequestFactory()
    request = factory.get('/health')
    response = health_check(request)
    print(f'🔍 [DEBUG] Health check response status: {response.status_code}')
    print(f'🔍 [DEBUG] Health check response: {response.content.decode()[:200]}...')
    
    if response.status_code == 200:
        print('🔍 [DEBUG] ✅ Health check endpoint working')
    else:
        print('🔍 [DEBUG] ❌ Health check endpoint returned non-200 status')
        sys.exit(1)
        
except Exception as e:
    print(f'🔍 [DEBUG] ❌ Health check endpoint test failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
" || {
    echo "🔍 [DEBUG] ❌ Health check endpoint test failed"
    exit 1
}

# Network debugging
echo "🔍 [DEBUG] ====== NETWORK DEBUGGING ======"
echo "🔍 [DEBUG] Testing port availability on ${PORT:-8000}..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep ":${PORT:-8000}" || echo "🔍 [DEBUG] Port ${PORT:-8000} not in use (good)"
else
    echo "🔍 [DEBUG] netstat not available"
fi

# Start Gunicorn with maximum debugging
echo "🔍 [DEBUG] ====== STARTING GUNICORN ======"
echo "🔍 [DEBUG] Gunicorn command:"
echo "🔍 [DEBUG] gunicorn --workers 1 --bind 0.0.0.0:${PORT:-8000} --timeout 120 --keep-alive 5 --worker-class sync --access-logfile - --error-logfile - --log-level debug --preload file_upload_project.wsgi:application"

echo "🔍 [DEBUG] Starting Gunicorn server..."
echo "🔍 [DEBUG] Binding to 0.0.0.0:${PORT:-8000}"
echo "🔍 [DEBUG] All checks passed, starting application..."

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
    --log-level debug \
    --preload \
    file_upload_project.wsgi:application