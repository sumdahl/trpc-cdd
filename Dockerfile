# ---- base ----
FROM oven/bun:1.3.10-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- runner ----
FROM oven/bun:1.3.10-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup drizzle ./drizzle
COPY --chown=appuser:appgroup scripts ./scripts
COPY --chown=appuser:appgroup package.json ./package.json
COPY --chown=appuser:appgroup tsconfig.json ./tsconfig.json

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/v1/health || exit 1

CMD ["bun", "src/index.ts"]
