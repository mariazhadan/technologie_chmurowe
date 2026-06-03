FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE=
ARG VITE_OAUTH_AUTHORITY=https://xpo.local/realms/xpo-logistics
ARG VITE_OAUTH_CLIENT_ID=xpo-frontend

ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_OAUTH_AUTHORITY=$VITE_OAUTH_AUTHORITY
ENV VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

RUN addgroup -S app && adduser -S app -G app

COPY --chown=app:app nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=app:app /app/dist /usr/share/nginx/html

RUN chown -R app:app /etc/nginx/conf.d /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx /run

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s \
CMD wget -qO- http://127.0.0.1:8080/nginx-health || exit 1
