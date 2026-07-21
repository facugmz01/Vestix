# syntax=docker/dockerfile:1.6
# Vestix ERP — Frontend (Vite build + Nginx)
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --unsafe-perm

COPY frontend/ ./

# Same-origin API via Nginx proxy (see nginx.conf)
ARG VITE_API_BASE=/api
ARG VITE_APP_URL=
ARG VITE_STOREFRONT_DOMAIN=
ARG VITE_APP_NAME=Vestix
ARG VITE_APP_VERSION=1.0.0
ARG VITE_ENV=production

ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_APP_URL=$VITE_APP_URL \
    VITE_STOREFRONT_DOMAIN=$VITE_STOREFRONT_DOMAIN \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_ENV=$VITE_ENV

RUN npm run build

FROM nginx:1.27-alpine AS runner

RUN apk add --no-cache curl

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
