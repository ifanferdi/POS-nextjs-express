# syntax=docker/dockerfile:1

# Backend (Express + Prisma) — build context = repo root (Bun workspace).

# ---- deps: workspace deps for @pos/api (incl. dev: prisma, typescript) ----
FROM oven/bun:1 AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/app/package.json apps/app/package.json
RUN bun install --frozen-lockfile --filter @pos/api

# ---- builder: generate Prisma client (also reused for db push/seed via compose) ----
FROM deps AS builder
ENV APP_ENV=production
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN bunx prisma generate

# ---- runner: production image ----
FROM oven/bun:1-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/app/package.json apps/app/package.json
RUN bun install --frozen-lockfile --production --filter @pos/api && bun pm cache rm

COPY --from=builder /repo/apps/api/tsconfig.json /repo/apps/api/prisma.config.ts ./apps/api/
COPY --from=builder /repo/apps/api/src ./apps/api/src
COPY --from=builder /repo/apps/api/docs ./apps/api/docs

WORKDIR /repo/apps/api
EXPOSE 8000

CMD ["bun", "src/app.ts"]
