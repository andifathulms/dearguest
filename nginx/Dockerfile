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
ENV VITE_PUBLIC_ORIGIN=$VITE_PUBLIC_ORIGIN \
    VITE_ADMIN_WHATSAPP_NUMBER=$VITE_ADMIN_WHATSAPP_NUMBER
RUN npm run build

FROM nginx:1.25-alpine
RUN apk add --no-cache openssl && rm -f /etc/nginx/conf.d/default.conf
COPY nginx/templates/ /etc/nginx/templates/
COPY nginx/snippets/ /etc/nginx/snippets/
COPY --chmod=755 nginx/tls-link.sh /usr/local/bin/tls-link
COPY --chmod=755 nginx/docker-entrypoint.d/ /docker-entrypoint.d/
COPY --from=spa /app/dist /usr/share/nginx/html
