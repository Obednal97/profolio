# Frontend image (Next.js).
# Build context is the REPOSITORY ROOT so pnpm can see the workspace manifests:
#   docker build -f frontend/Dockerfile .

FROM node:22-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app


# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend


# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY frontend/ frontend/

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be present here rather than only at runtime. Changing one requires
# rebuilding the image.
ARG NEXT_PUBLIC_AUTH_MODE=local
ARG NEXT_PUBLIC_ENABLE_DEMO_MODE=true
ARG NEXT_PUBLIC_SHOW_LANDING_PAGE=true
ARG NEXT_PUBLIC_ALLOW_REGISTRATION=true
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NEXT_PUBLIC_ENABLE_DEMO_MODE=$NEXT_PUBLIC_ENABLE_DEMO_MODE
ENV NEXT_PUBLIC_SHOW_LANDING_PAGE=$NEXT_PUBLIC_SHOW_LANDING_PAGE
ENV NEXT_PUBLIC_ALLOW_REGISTRATION=$NEXT_PUBLIC_ALLOW_REGISTRATION
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV DOCKER_BUILD=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/frontend
RUN pnpm build


# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# The standalone bundle carries its own minimal node_modules, so nothing is
# installed here. Paths are workspace-relative because outputFileTracingRoot
# was set to the repo root.
COPY --from=build --chown=node:node /app/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=build --chown=node:node /app/frontend/public ./frontend/public

USER node
EXPOSE 3000

CMD ["node", "frontend/server.js"]
