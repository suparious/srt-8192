# Build stage
FROM node:22-alpine AS builder

# Add build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# First, generate package-lock.json if it doesn't exist
RUN npm install

# Then use npm ci for deterministic builds
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Environment variables
ENV NODE_ENV=production \
    PORT=8080

# Health check with fixed intervals - can be overridden by individual services
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE ${PORT}

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]