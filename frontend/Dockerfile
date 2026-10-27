# Dev server image (docker-compose.yml). The production build lives in
# nginx/Dockerfile, which compiles the SPA and serves it from the edge nginx.
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
