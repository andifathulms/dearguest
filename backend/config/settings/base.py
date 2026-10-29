from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-changeme')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'apps.invitations',
    'apps.auth_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

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

WSGI_APPLICATION = 'config.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'id-id'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# User uploads can be served from their own origin (e.g. https://media.example.com)
# so an uploaded file can never run script on the app's origin. Unset = same origin.
MEDIA_URL_ORIGIN = config('MEDIA_URL_ORIGIN', default='').rstrip('/')
MEDIA_URL = f'{MEDIA_URL_ORIGIN}/media/'
MEDIA_ROOT = config('MEDIA_ROOT', default=str(BASE_DIR / 'media'))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.auth_api.authentication.CookieJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    # Scoped throttling: only views that set `throttle_scope` are limited.
    'DEFAULT_THROTTLE_CLASSES': [
        'apps.invitations.throttling.ClientIPScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'register': '10/hour',
        'login': '20/hour',
        'password_reset': '5/hour',
        'activate': '10/hour',
        'guest_lookup': '60/hour',
        'guest_open': '120/hour',
        'funnel': '30/hour',
    },
}

# Tokens live in httpOnly cookies (apps/auth_api/cookies.py). Short access
# tokens; refresh tokens rotate and the used one is blacklisted, so a stolen
# refresh token stops working after one use by either party.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
AUTH_COOKIE_SECURE = config('AUTH_COOKIE_SECURE', default=not DEBUG, cast=bool)

# Shared cache: rate limits must be counted across all gunicorn workers, which a
# per-process LocMemCache can't do. Unset REDIS_URL only for running manage.py
# outside docker (throttles are then per-process).
REDIS_URL = config('REDIS_URL', default='')
CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': REDIS_URL}
    if REDIS_URL else
    {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}
}

# Only behind our own nginx may the client IP come from a header (X-Real-IP).
# See apps.invitations.throttling.client_ip.
TRUST_PROXY_HEADERS = config('TRUST_PROXY_HEADERS', default=False, cast=bool)

# Email (console backend in dev; configure SMTP via env in production).
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Undangan Digital <noreply@undangan.local>')
ADMIN_EMAIL = config('ADMIN_EMAIL', default='admin@undangan.local')

# Public URLs used in emails, share pages, and redirects.
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173').rstrip('/')
ADMIN_WHATSAPP_NUMBER = config('ADMIN_WHATSAPP_NUMBER', default='628123456789')
