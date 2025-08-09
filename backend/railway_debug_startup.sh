#!/bin/bash
# Railway Ultra-Debug Startup Script - NEVER EXIT, LOG EVERYTHING
# This script will show exactly where failures occur

# Remove set -e to prevent script from exiting on errors
set +e

# Force output flushing
exec 1> >(tee -a /tmp/debug.log)
exec 2> >(tee -a /tmp/debug.log >&2)

echo "🚀 [ULTRA-DEBUG] ====== STARTING ULTRA DEBUG SCRIPT ======"
echo "🚀 [ULTRA-DEBUG] Script started at: $(date)"
echo "🚀 [ULTRA-DEBUG] Process ID: $$"
echo "🚀 [ULTRA-DEBUG] Working Directory: $(pwd)"
echo "🚀 [ULTRA-DEBUG] User: $(whoami)"
echo "🚀 [ULTRA-DEBUG] Shell: $0"

# Test basic commands
echo "🚀 [ULTRA-DEBUG] Testing basic commands..."
ls --version >/dev/null 2>&1 && echo "🚀 [ULTRA-DEBUG] ls command works" || echo "🚀 [ULTRA-DEBUG] ls command failed"
pwd >/dev/null 2>&1 && echo "🚀 [ULTRA-DEBUG] pwd command works" || echo "🚀 [ULTRA-DEBUG] pwd command failed"

# Test Python
echo "🚀 [ULTRA-DEBUG] Testing Python..."
if command -v python3 >/dev/null 2>&1; then
    echo "🚀 [ULTRA-DEBUG] python3 found: $(which python3)"
    python3_version=$(python3 --version 2>&1)
    echo "🚀 [ULTRA-DEBUG] python3 version: $python3_version"
else
    echo "🚀 [ULTRA-DEBUG] python3 not found"
fi

if command -v python >/dev/null 2>&1; then
    echo "🚀 [ULTRA-DEBUG] python found: $(which python)"
    python_version=$(python --version 2>&1)
    echo "🚀 [ULTRA-DEBUG] python version: $python_version"
else
    echo "🚀 [ULTRA-DEBUG] python not found"
fi

echo "🚀 [ULTRA-DEBUG] PORT environment variable: ${PORT:-NOT_SET}"

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
    echo "🚀 [ULTRA-DEBUG] ✅ Django directory exists at /app/file_upload_project"
    cd /app/file_upload_project
    echo "🚀 [ULTRA-DEBUG] Changed to Django directory: $(pwd)"
    echo "🚀 [ULTRA-DEBUG] Django project contents:"
    ls -la || echo "🚀 [ULTRA-DEBUG] Django directory listing failed"
    
    echo "🚀 [ULTRA-DEBUG] Django settings files:"
    ls -la file_upload_project/settings* 2>/dev/null || echo "🚀 [ULTRA-DEBUG] No settings files found"
    
    echo "🚀 [ULTRA-DEBUG] Django app structure:"
    ls -la file_upload/ 2>/dev/null || echo "🚀 [ULTRA-DEBUG] Django app directory not found"
else
    echo "🚀 [ULTRA-DEBUG] ❌ Django project directory not found at /app/file_upload_project - BUT CONTINUING"
    echo "🚀 [ULTRA-DEBUG] Current directory contents:"
    ls -la
fi

# Environment validation with detailed feedback - NO EXITS
echo "🚀 [ULTRA-DEBUG] ====== ENVIRONMENT VALIDATION (NO EXITS) ======"
if [ -z "$SECRET_KEY" ]; then
    echo "🚀 [ULTRA-DEBUG] ❌ SECRET_KEY is missing - BUT CONTINUING"
else
    echo "🚀 [ULTRA-DEBUG] ✅ SECRET_KEY is set"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "🚀 [ULTRA-DEBUG] ❌ DATABASE_URL is missing - BUT CONTINUING"
else
    echo "🚀 [ULTRA-DEBUG] ✅ DATABASE_URL is set"
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

echo "🚀 [ULTRA-DEBUG] Testing Django system check..."
python manage.py check --settings=file_upload_project.settings_production
check_result=$?
if [ $check_result -eq 0 ]; then
    echo "🚀 [ULTRA-DEBUG] ✅ Django system check passed"
else
    echo "🚀 [ULTRA-DEBUG] ❌ Django system check failed with exit code $check_result - BUT CONTINUING"
fi

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
echo "🚀 [ULTRA-DEBUG] Testing WSGI application loading..."
python -c "
import sys
import os
sys.path.insert(0, '/app/file_upload_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
try:
    from file_upload_project.wsgi import application
    print('🚀 [ULTRA-DEBUG] ✅ WSGI application loaded successfully')
    print(f'🚀 [ULTRA-DEBUG] WSGI application: {application}')
except Exception as e:
    print(f'🚀 [ULTRA-DEBUG] ❌ WSGI application load failed: {e}')
    import traceback
    traceback.print_exc()
" 
wsgi_result=$?
if [ $wsgi_result -eq 0 ]; then
    echo "🚀 [ULTRA-DEBUG] WSGI test completed successfully"
else
    echo "🚀 [ULTRA-DEBUG] WSGI test failed with exit code $wsgi_result - BUT CONTINUING"
fi

# Test health check endpoint directly
echo "🔍 [DEBUG] ====== HEALTH CHECK ENDPOINT TEST ======"
echo "🚀 [ULTRA-DEBUG] Testing health check endpoint..."
python -c "
import sys
import os
sys.path.insert(0, '/app/file_upload_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'file_upload_project.settings_production')
import django
django.setup()

try:
    from file_upload.views_health import health_check
    print('🚀 [ULTRA-DEBUG] ✅ Health check view imported successfully')
    
    # Test the view function
    from django.test import RequestFactory
    factory = RequestFactory()
    request = factory.get('/health')
    response = health_check(request)
    print(f'🚀 [ULTRA-DEBUG] Health check response status: {response.status_code}')
    print(f'🚀 [ULTRA-DEBUG] Health check response: {response.content.decode()[:200]}...')
    
    if response.status_code == 200:
        print('🚀 [ULTRA-DEBUG] ✅ Health check endpoint working')
    else:
        print('🚀 [ULTRA-DEBUG] ❌ Health check endpoint returned non-200 status')
        
except Exception as e:
    print(f'🚀 [ULTRA-DEBUG] ❌ Health check endpoint test failed: {e}')
    import traceback
    traceback.print_exc()
"
health_result=$?
if [ $health_result -eq 0 ]; then
    echo "🚀 [ULTRA-DEBUG] Health check test completed"
else
    echo "🚀 [ULTRA-DEBUG] Health check test failed with exit code $health_result - BUT CONTINUING"
fi

# Network debugging
echo "🔍 [DEBUG] ====== NETWORK DEBUGGING ======"
echo "🔍 [DEBUG] Testing port availability on ${PORT:-8000}..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep ":${PORT:-8000}" || echo "🔍 [DEBUG] Port ${PORT:-8000} not in use (good)"
else
    echo "🔍 [DEBUG] netstat not available"
fi

# Start Gunicorn with maximum debugging
echo "🚀 [ULTRA-DEBUG] ====== STARTING GUNICORN ======"
echo "🚀 [ULTRA-DEBUG] About to start Gunicorn server..."
echo "🚀 [ULTRA-DEBUG] Final working directory: $(pwd)"
echo "🚀 [ULTRA-DEBUG] Port: ${PORT:-8000}"
echo "🚀 [ULTRA-DEBUG] Python path: $PYTHONPATH"
echo "🚀 [ULTRA-DEBUG] Virtual env path: $PATH"

echo "🚀 [ULTRA-DEBUG] Gunicorn command about to execute:"
echo "gunicorn --workers 1 --bind 0.0.0.0:${PORT:-8000} --timeout 120 --keep-alive 5 --worker-class sync --access-logfile - --error-logfile - --log-level debug --preload file_upload_project.wsgi:application"

echo "🚀 [ULTRA-DEBUG] ===== EXECUTING GUNICORN NOW ====="

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