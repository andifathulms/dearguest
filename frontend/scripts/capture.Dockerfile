# The Playwright image the visual suite uses, plus ffmpeg (VP9 / H.264) for
# theme preview loops. Built once by capture-docker.sh.
FROM mcr.microsoft.com/playwright:v1.61.1-noble
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
