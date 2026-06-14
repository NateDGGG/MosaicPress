# Mosaic — production image (defaults to PostgreSQL via docker-compose).
FROM node:20-slim AS build
WORKDIR /app

# Prisma needs OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN chmod +x docker-entrypoint.sh

# Build targeting PostgreSQL (the compose default). Override with
# --build-arg DATABASE_PROVIDER=sqlite for a SQLite image.
ARG DATABASE_PROVIDER=postgresql
ENV DATABASE_PROVIDER=$DATABASE_PROVIDER
RUN node scripts/set-provider.mjs \
    && npx prisma generate \
    && npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the whole built app (full node_modules keeps Prisma + tsx available for
# migrations/seeding at startup).
COPY --from=build /app ./

ENV DATABASE_PROVIDER=postgresql
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
