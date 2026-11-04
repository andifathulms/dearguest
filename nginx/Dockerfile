# Production edge image: builds the SPA and serves it, proxies /api/ /admin/
# /share/ to Django, and serves /static/ and /media/. Build context: repo root.

FROM node:20-alpine AS spa
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Public site origin for share links / QR codes; vite.config.js fails the build without it.
ARG VITE_PUBLIC_ORIGIN
ARG VITE_ADMIN_WHATSAPP_NUMBER
# Error tracking (optional): DSN, the git SHA as the release, and where to
# upload source maps. The auth token is a BuildKit secret, never a layer.
ARG VITE_SENTRY_DSN=
ARG VITE_RELEASE=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT=
ENV VITE_PUBLIC_ORIGIN=$VITE_PUBLIC_ORIGIN \
    VITE_ADMIN_WHATSAPP_NUMBER=$VITE_ADMIN_WHATSAPP_NUMBER \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_RELEASE=$VITE_RELEASE
# Source maps are uploaded to Sentry, then deleted: they are never served.
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -s /run/secrets/sentry_auth_token ] && [ -n "$SENTRY_ORG" ]; then \
      SENTRY_SOURCEMAPS=1 npm run build && \
      SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" npx --yes @sentry/cli@2 sourcemaps upload \
        --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" --release "$VITE_RELEASE" dist; \
    else \
      npm run build; \
    fi && find dist -name '*.map' -delete

FROM nginx:1.25-alpine
RUN apk add --no-cache openssl && rm -f /etc/nginx/conf.d/default.conf
COPY nginx/templates/ /etc/nginx/templates/
COPY nginx/snippets/ /etc/nginx/snippets/
COPY --chmod=755 nginx/tls-link.sh /usr/local/bin/tls-link
COPY --chmod=755 nginx/docker-entrypoint.d/ /docker-entrypoint.d/
COPY --from=spa /app/dist /usr/share/nginx/html
