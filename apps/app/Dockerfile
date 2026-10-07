# syntax=docker/dockerfile:1

# Frontend (Next.js 16) — build context = repo root (Bun workspace).

# ---- deps: workspace deps for @pos/app ----
FROM oven/bun:1 AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/app/package.json apps/app/package.json
COPY apps/api/package.json apps/api/package.json
RUN bun install --frozen-lockfile --filter ./apps/app

# ---- builder: next build (NEXT_PUBLIC_* inlined here) ----
FROM deps AS builder
WORKDIR /repo
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=""
ARG NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION="false"
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=$NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
COPY apps/app apps/app
WORKDIR /repo/apps/app
RUN bun run build

# ---- runner: production image ----
FROM oven/bun:1-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY apps/app/package.json apps/app/package.json
COPY apps/api/package.json apps/api/package.json
RUN bun install --frozen-lockfile --production --filter ./apps/app && bun pm cache rm

COPY --from=builder /repo/apps/app/.next ./apps/app/.next
COPY --from=builder /repo/apps/app/public ./apps/app/public
COPY --from=builder /repo/apps/app/next.config.ts ./apps/app/next.config.ts

WORKDIR /repo/apps/app
EXPOSE 3000

CMD ["bun", "run", "start"]
