# syntax=docker/dockerfile:1
# Образ лендинга (apps/web). Контекст сборки — корень репозитория:
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

RUN bun turbo run build -F "@acme/web^..."

# Адрес приложения, на который ведут ссылки лендинга. Вшивается в бандл.
ARG NEXT_PUBLIC_APP_URL=https://app.paramlab.ru
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# `next build` вызывается напрямую: скрипт build из package.json читает
# ../../.env, которого в образе нет.
RUN cd apps/web && bun run next build

FROM node:24.11.1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# standalone повторяет структуру монорепо: server.js лежит в apps/web.
# Каталога public у лендинга нет.
COPY --from=builder --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
