# Production Dockerfile for Profolio
# Multi-stage build for optimized production image

# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend

# Install pnpm
RUN npm install -g pnpm@9.14.4

# Copy package files for dependency caching
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY backend/ ./

# Generate Prisma client and build
RUN pnpm prisma generate
RUN pnpm run build

# Remove dev dependencies for smaller image
RUN pnpm prune --prod

# Build stage for frontend  
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm@9.14.4

# Copy package files for dependency caching
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Remove dev dependencies for smaller image
RUN pnpm prune --prod

# Production runtime stage
FROM node:18-alpine AS production

# Install production dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client \
    bash \
    && rm -rf /var/cache/apk/*

# Install pnpm globally
RUN npm install -g pnpm@9.14.4

# Create non-root user for security
RUN addgroup -g 1001 -S profolio && \
    adduser -S profolio -u 1001

# Create application directories
RUN mkdir -p /app/backend /app/frontend && \
    chown -R profolio:profolio /app

# Set up backend
WORKDIR /app/backend
COPY --from=backend-builder --chown=profolio:profolio /app/backend/dist ./dist
COPY --from=backend-builder --chown=profolio:profolio /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=profolio:profolio /app/backend/package.json ./
COPY --from=backend-builder --chown=profolio:profolio /app/backend/prisma ./prisma

# Set up frontend
WORKDIR /app/frontend
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/.next ./.next
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/package.json ./
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/public ./public

# Create logs and uploads directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R profolio:profolio /app/logs /app/uploads

# Copy startup script
COPY --chown=profolio:profolio docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Set up environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Switch to non-root user
USER profolio

# Expose ports
EXPOSE 3000 3001

# Set the working directory to app root
WORKDIR /app

# Start the application
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"] 