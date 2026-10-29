"""gunicorn for production (docker-compose.prod.yml). Tuned in Phase 5 with the
wedding-morning load test (loadtest/, LAUNCH-READINESS.md): threads let one
worker overlap the DB and Redis waits of several guests."""
import multiprocessing
import os

bind = '0.0.0.0:8000'
worker_class = 'gthread'
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
threads = int(os.environ.get('GUNICORN_THREADS', 4))
timeout = 30
graceful_timeout = 20
keepalive = 5
# Recycle workers now and then so a slow leak can't build up over weeks.
max_requests = 2000
max_requests_jitter = 200
# Request logs come from nginx (with the request id); gunicorn logs errors only.
accesslog = None
errorlog = '-'
