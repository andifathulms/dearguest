FROM python:3.12-slim AS app
WORKDIR /app
# libfribidi0 lets the raqm bundled in Pillow's wheels shape text (OG images, og.py).
RUN apt-get update && apt-get install -y libpq-dev gcc libfribidi0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Scheduled jobs (manage.py run_scheduler): nightly encrypted backups to R2,
# the retention purge and the certificate check. The Postgres client matches
# the server's major version (16, from the PostgreSQL apt repository): a
# newer pg_dump writes settings a 16 server rejects on restore. age encrypts;
# rclone talks to R2.
FROM app AS scheduler
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg age rclone openssl \
 && install -d /usr/share/postgresql-common/pgdg \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
 && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt trixie-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client-16 \
 && rm -rf /var/lib/apt/lists/*
