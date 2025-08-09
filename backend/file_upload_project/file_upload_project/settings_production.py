"""
Django settings for file_upload_project project - PRODUCTION
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

# Validate critical environment variables (Railway-compatible)
CRITICAL_ENV_VARS = [
    'SECRET_KEY',
    'DATABASE_URL',
]

# Check critical vars that must be present
for var in CRITICAL_ENV_VARS:
    if os.getenv(var) is None:
        raise Exception(f'Critical environment variable "{var}" is missing!')

# Optional environment variables with defaults
OPTIONAL_ENV_VARS = {
    'ALLOWED_HOSTS': 'api.preppad.xyz,localhost,127.0.0.1',
    'CORS_ALLOWED_ORIGINS': 'https://www.preppad.xyz,https://preppad.xyz',
    'JWT_SECRET_KEY': os.getenv('SECRET_KEY'),  # Fallback to SECRET_KEY if JWT_SECRET_KEY not set
    'DEEPSEEK_API_KEY': '',  # Optional for some deployments
}

# Set defaults for optional vars if not provided
for var, default in OPTIONAL_ENV_VARS.items():
    if os.getenv(var) is None and default:
        os.environ[var] = default

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# PRODUCTION SECURITY SETTINGS
SECRET_KEY = os.getenv('SECRET_KEY')

# PRODUCTION: Disable debug mode
DEBUG = False

# PRODUCTION: Restrict allowed hosts
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# PRODUCTION: Security headers and HTTPS
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# PRODUCTION: Session security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# PRODUCTION: Database configuration - PostgreSQL
import dj_database_url
DATABASES = {
    'default': dj_database_url.parse(os.getenv('DATABASE_URL'))
}

# Database connection pooling and security
DATABASES['default'].update({
    'CONN_MAX_AGE': 600,
    'OPTIONS': {
        'sslmode': 'require',
        'connect_timeout': 10,
        'application_name': 'preppad_backend',
    }
})

# PRODUCTION: Static and media files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# PRODUCTION: Use Cloudinary for media files
USE_CLOUDINARY = os.getenv('USE_CLOUDINARY', 'True').lower() == 'true'

if USE_CLOUDINARY:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    
    cloudinary.config(
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key = os.getenv('CLOUDINARY_API_KEY'),
        api_secret = os.getenv('CLOUDINARY_API_SECRET'),
        secure = True
    )
    
    # Use Cloudinary for media files
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = f"https://res.cloudinary.com/{os.getenv('CLOUDINARY_CLOUD_NAME')}/image/upload/"
else:
    # Fallback to local storage
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# PRODUCTION: CORS security
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'file_upload',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
]

# PRODUCTION: REST Framework with authentication enabled
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/day',    # Strict for production
        'user': '100/day',   # Reasonable for authenticated users
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# PRODUCTION: JWT Settings with strong security
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),   # Short-lived for security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # 1 day maximum
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY'),
    'ALGORITHM': 'HS256',
    'VERIFY_SIGNATURE': True,
    'VERIFY_EXP': True,
    'VERIFY_NBF': True,
    'REQUIRE_EXP': True,
    'REQUIRE_NBF': False,
}

# PRODUCTION: Enhanced middleware stack
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # For static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'file_upload_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'file_upload_project.wsgi.application'

# PRODUCTION: Strong password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,  # Stronger minimum length
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# PRODUCTION: Railway-compatible logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'error_console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'file_upload': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'gunicorn': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# PRODUCTION: Cache configuration
REDIS_URL = os.getenv('REDIS_URL')

if REDIS_URL:
    # Use Redis if available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'preppad',
            'TIMEOUT': 300,
        }
    }
else:
    # Fallback to in-memory cache if Redis is not available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'TIMEOUT': 300,
        }
    }

# PRODUCTION: Email configuration
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# Check if all email environment variables are available
EMAIL_AVAILABLE = all([EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD])

if EMAIL_AVAILABLE:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_USE_TLS = True
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@preppad.com')
else:
    # Fallback to console backend for development/debugging
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@preppad.com'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# PRODUCTION: File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# PRODUCTION: Additional security settings
ADMINS = [
    ('Admin', os.getenv('ADMIN_EMAIL', 'admin@preppad.com')),
]
MANAGERS = ADMINS

# Rate limiting for API endpoints
DEFAULT_THROTTLE_RATES = {
    'login': '5/min',
    'register': '3/min',
    'password_reset': '3/hour',
    'file_upload': '10/hour',
}