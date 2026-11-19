# syntax=docker/dockerfile:1
# Образ сайта и личного кабинета (apps/web). Контекст сборки — корень
# репозитория:
#   docker build -f apps/web/Dockerfile -t ghcr.io/theparamlab/web:latest .

# Версии совпадают с .nvmrc и packageManager в package.json.
FROM node:24.11.1-slim AS base
COPY --from=oven/bun:1.4.4 /usr/local/bin/bun /usr/local/bin/bun

FROM base AS builder
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Пакеты, которые собираются в dist/ (@acme/config, @acme/emails, ...).
RUN bun turbo run build -F "@acme/web^..."

# NEXT_PUBLIC_* вшиваются в клиентский бандл, поэтому задаются при сборке.
ARG NEXT_PUBLIC_APP_URL=https://paramlab.ru
ARG NEXT_PUBLIC_APP_NAME=ParamLab
ARG NEXT_PUBLIC_APP_SHORT_NAME=ParamLab
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_SHORT_NAME=$NEXT_PUBLIC_APP_SHORT_NAME

# `next build` вызывается напрямую: скрипт build из package.json читает
# ../../.env, которого в образе нет. POSTGRES_URL и AUTH_SECRET — заглушки:
# модули проверяют их при загрузке, но к базе сборка не подключается.
# В итоговый образ они не попадают, настоящие значения приходят из окружения.
RUN cd apps/web && \
    APP_URL="$NEXT_PUBLIC_APP_URL" \
    POSTGRES_URL=postgres://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder-not-a-real-secret \
    bun run next build

FROM node:24.11.1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# standalone повторяет структуру монорепо: server.js лежит в apps/web.
# Каталога public у приложения нет.
COPY --from=builder --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
