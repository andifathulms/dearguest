FROM python:3.12-slim
WORKDIR /app
# libfribidi0 lets the raqm bundled in Pillow's wheels shape text (OG images, og.py).
RUN apt-get update && apt-get install -y libpq-dev gcc libfribidi0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
