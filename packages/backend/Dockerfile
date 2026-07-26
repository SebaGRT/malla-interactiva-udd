FROM node:22-bookworm-slim AS base
RUN corepack enable

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY data ./data
RUN pnpm --filter @malla-udd/shared build
RUN pnpm --filter @malla-udd/backend build
RUN pnpm --filter @malla-udd/backend db:import

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV DATABASE_PATH=/app/data/malla.db
WORKDIR /app
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/backend/package.json ./packages/backend/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/data ./data
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "packages/backend/dist/index.js"]
