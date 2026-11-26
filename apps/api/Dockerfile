# ---- Stage 1: Build (generate Prisma client) ----
FROM oven/bun:1 AS builder

# Backend (Express + Prisma) — build context = repo root (Bun workspace).

# ---- deps: workspace deps for @pos/api (incl. dev: prisma, typescript) ----
FROM oven/bun:1 AS deps
WORKDIR /repo
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json prisma.config.ts global.d.ts ./
COPY src/ src/
COPY docs/openapi.yaml docs/openapi.yaml

# ---- builder: generate Prisma client (also reused for db push/seed via compose) ----
FROM deps AS builder
ENV APP_ENV=production
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN bunx prisma generate

# ---- runner: production image ----
FROM oven/bun:1-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates && \
  rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json /app/global.d.ts /app/prisma.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/docs ./docs

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/app/package.json apps/app/package.json
RUN bun install --frozen-lockfile --production --filter ./apps/api && bun pm cache rm

CMD ["bun", "src/app.ts"]
