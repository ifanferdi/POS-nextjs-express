# ---- Stage 1: Build ----
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json prisma.config.ts ./
COPY src/ src/
COPY global.d.ts ./

RUN bunx prisma generate
RUN bun run build

# ---- Stage 2: Production ----
FROM oven/bun:1-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates && \
  rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/infrastructure/database/prisma/generated ./src/infrastructure/database/prisma/generated
COPY --from=builder /app/src/infrastructure/database/migrations ./src/infrastructure/database/migrations
COPY --from=builder /app/src/infrastructure/database/prisma/schemas ./src/infrastructure/database/prisma/schemas
COPY --from=builder /app/prisma.config.ts ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "dist/app.js"]
