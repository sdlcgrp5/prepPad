"""
Django settings for file_upload_project project - DEVELOPMENT
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

# Validate required environment variables (KEEP - DeepSeek related)
REQUIRED_ENV_VARS = [
    'DEEPSEEK_API_KEY',
]

for var in REQUIRED_ENV_VARS:
    if os.getenv(var) is None:
        raise Exception(f'Required environment variable "{var}" is missing!')

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# DEVELOPMENT SETTINGS
SECRET_KEY = 'django-insecure-p)k-z9^*%a#$72=kkexf24$e^1%sxa1b@j=@$l!0)_2$(u80f+'

# DEVELOPMENT: Enable debug mode
DEBUG = True

# DEVELOPMENT: Allow all hosts for local development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# DEVELOPMENT: Remove production security settings
# (Remove all SECURE_* settings)

# DEVELOPMENT: Simple database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# DEVELOPMENT: Local static/media files
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# DEVELOPMENT: Allow all origins for CORS
CORS_ALLOW_ALL_ORIGINS = True

# Application definition (KEEP AS IS)
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

# REST Framework settings (KEEP AS IS)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',  # Disabled for development
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # 'rest_framework.permissions.IsAuthenticated',  # Disabled for development
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',  # Increased for development
        'user': '200/day',  # Increased for development
   },
}

# JWT Settings (KEEP AS IS)
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Longer for development
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Longer for development
    'ROTATE_REFRESH_TOKENS': False,
    'UPDATE_LAST_LOGIN': False,
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'