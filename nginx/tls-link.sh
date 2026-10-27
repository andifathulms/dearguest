#!/bin/sh
# Point /etc/nginx/tls/{fullchain,privkey}.pem at the real certificate.
#
# TLS_CERT_PATH / TLS_KEY_PATH default to the Let's Encrypt live files for
# $DOMAIN. Until those exist (first boot, before certbot has run), a temporary
# self-signed pair is generated so nginx can start and answer the HTTP-01
# challenge on port 80. Re-run after issuing: `tls-link && nginx -s reload`.
set -eu

dir=/etc/nginx/tls
cert="${TLS_CERT_PATH:-/etc/letsencrypt/live/${DOMAIN}/fullchain.pem}"
key="${TLS_KEY_PATH:-/etc/letsencrypt/live/${DOMAIN}/privkey.pem}"
mkdir -p "$dir"

if [ -s "$cert" ] && [ -s "$key" ]; then
    ln -sfn "$cert" "$dir/fullchain.pem"
    ln -sfn "$key" "$dir/privkey.pem"
    echo "tls-link: using $cert"
elif [ ! -e "$dir/fullchain.pem" ]; then
    echo "tls-link: no certificate at $cert yet; using a temporary self-signed one" >&2
    openssl req -x509 -nodes -newkey rsa:2048 -days 30 -subj "/CN=${DOMAIN}" \
        -keyout "$dir/privkey.pem" -out "$dir/fullchain.pem" 2>/dev/null
fi
