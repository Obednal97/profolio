# Backend image (NestJS + Prisma).
# Build context is the REPOSITORY ROOT, not backend/, because pnpm needs the
# workspace manifests (pnpm-workspace.yaml, pnpm-lock.yaml) to resolve deps.
#   docker build -f backend/Dockerfile .

# Debian slim rather than Alpine: Prisma's query engine and bcrypt's native
# build are both markedly less troublesome against glibc than musl.
FROM node:22-bookworm-slim AS base
# openssl is a hard runtime requirement for the Prisma query engine.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app


# ---- dependencies -----------------------------------------------------------
FROM base AS deps
# Toolchain for bcrypt: prebuilt binaries are not published for every
# platform/Node combination, so it may need compiling from source. These stay
# in this stage only and never reach the runtime image.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Both workspace manifests are required for --frozen-lockfile to validate.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# The backend's postinstall runs `prisma generate`, which needs the schema and
# config present before install. Copied separately from the rest of the source
# so that editing application code does not invalidate the dependency layer.
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/

RUN pnpm install --frozen-lockfile --filter profolio-backend


# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY backend/ backend/
WORKDIR /app/backend
RUN pnpm prisma generate
RUN pnpm build


# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production

# Drop privileges. The node image ships an unprivileged `node` user already.
COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/backend/node_modules /app/backend/node_modules
COPY --from=build --chown=node:node /app/backend/dist /app/backend/dist
COPY --from=build --chown=node:node /app/backend/prisma /app/backend/prisma
COPY --from=build --chown=node:node /app/backend/package.json /app/backend/package.json
# Required by `prisma migrate deploy` at startup: Prisma 7 reads the datasource
# URL from here rather than from schema.prisma.
COPY --from=build --chown=node:node /app/backend/prisma.config.ts /app/backend/prisma.config.ts
COPY --chown=node:node backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/backend
USER node
EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
