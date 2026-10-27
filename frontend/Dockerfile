FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
# Public site origin baked into share links / QR codes; the build fails without it.
ARG VITE_PUBLIC_ORIGIN
ENV VITE_PUBLIC_ORIGIN=$VITE_PUBLIC_ORIGIN
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
