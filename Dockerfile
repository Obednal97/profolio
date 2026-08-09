# Profolio: one Next.js application, front and back.
#
# Build from the repository root:
#   docker build -t profolio .
#
# The separate backend image is gone - the NestJS service was merged into this
# application, so there is a single deployable and a single port.

FROM node:22-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates openssl \
 && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app


# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# The postinstall script runs `prisma generate`, which needs the schema.
COPY prisma/ prisma/
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile


# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be present here rather than only at runtime. Changing one requires
# rebuilding the image.
ARG NEXT_PUBLIC_AUTH_MODE=local
ARG NEXT_PUBLIC_ENABLE_DEMO_MODE=true
ARG NEXT_PUBLIC_SHOW_LANDING_PAGE=true
ARG NEXT_PUBLIC_ALLOW_REGISTRATION=true
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NEXT_PUBLIC_ENABLE_DEMO_MODE=$NEXT_PUBLIC_ENABLE_DEMO_MODE
ENV NEXT_PUBLIC_SHOW_LANDING_PAGE=$NEXT_PUBLIC_SHOW_LANDING_PAGE
ENV NEXT_PUBLIC_ALLOW_REGISTRATION=$NEXT_PUBLIC_ALLOW_REGISTRATION

ENV DOCKER_BUILD=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm exec prisma generate && pnpm build


# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# The standalone bundle carries its own minimal node_modules.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Migrations are applied by the entrypoint, so the schema and the CLI have to
# be present in the runtime image as well as at build time.
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./
COPY --from=build --chown=node:node /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=build --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=build --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma
COPY --chown=node:node docker-entrypoint.sh ./

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
