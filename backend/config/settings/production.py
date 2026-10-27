from .base import *
from decouple import config

DEBUG = False

# Fail fast if SECRET_KEY isn't set in production (no insecure fallback).
SECRET_KEY = config('SECRET_KEY')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='undangan_db'),
        'USER': config('DB_USER', default='undangan_user'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Django is reachable only through nginx in production, which sets X-Real-IP.
TRUST_PROXY_HEADERS = True

# Throttles need a cache shared by every worker; refuse to start without Redis.
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': config('REDIS_URL')}}

CORS_ALLOWED_ORIGINS = [o for o in config('CORS_ALLOWED_ORIGINS', default='').split(',') if o]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [o for o in config('CSRF_TRUSTED_ORIGINS', default='').split(',') if o]

# Security headers / cookies
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HTTPS (assumes TLS terminates at nginx/proxy)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
# HSTS starts at 1 hour, without preload, until HTTPS is confirmed working on
# the real domain: browsers remember HSTS, and a preload-list entry takes
# months to undo. Once the site has run cleanly over HTTPS for a while, raise
# it in steps via env (86400 → 604800 → 31536000). Only consider preload
# (SECURE_HSTS_PRELOAD = True, then hstspreload.org) when every subdomain serves HTTPS.
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=3600, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
