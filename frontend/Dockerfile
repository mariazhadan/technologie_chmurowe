FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE=
ARG VITE_OAUTH_AUTHORITY=http://localhost:8080/realms/xpo-logistics
ARG VITE_OAUTH_CLIENT_ID=xpo-frontend

ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_OAUTH_AUTHORITY=$VITE_OAUTH_AUTHORITY
ENV VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /etc/nginx/conf.d /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx /run

USER nginx

EXPOSE 8080
