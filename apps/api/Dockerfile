# ---- Stage 1: Build (generate Prisma client) ----
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json prisma.config.ts global.d.ts ./
COPY src/ src/
COPY docs/openapi.yaml docs/openapi.yaml

RUN bunx prisma generate

# ---- Stage 2: Production ----
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

EXPOSE 3000

CMD ["bun", "src/app.ts"]
