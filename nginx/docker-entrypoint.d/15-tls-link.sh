#!/bin/sh
# Runs before nginx starts (official image entrypoint hook).
set -eu
tls-link

# Pick up renewed certificates (certbot renews in its own container) every 6 h.
( while :; do sleep 21600; tls-link && nginx -s reload; done ) &
