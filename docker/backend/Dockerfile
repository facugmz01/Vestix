# syntax=docker/dockerfile:1.6
# Vestix ERP — Backend (NestJS + Prisma)
FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --unsafe-perm

FROM deps AS build

COPY backend/nest-cli.json backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npx prisma generate \
  && rm -rf dist tsconfig.tsbuildinfo \
  && npm run build \
  && test -f dist/main.js \
  && npm prune --omit=dev \
  && npm cache clean --force

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    tini \
    gosu \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 vestix \
  && useradd --system --uid 1001 --gid vestix --home-dir /app --shell /usr/sbin/nologin vestix \
  && mkdir -p /app/uploads /app/prisma

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY docker/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && chown -R vestix:vestix /app

# Entrypoint starts as root to fix uploads volume ownership, then drops to vestix.
USER root

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
