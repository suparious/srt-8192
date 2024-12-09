# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate environment file based on build arg
ARG NODE_ENV=production
RUN node scripts/generate-env.js

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built assets from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy required root files
COPY --from=builder /app/next.config.js ./

# Add tini and curl for proper signal handling and health checks
RUN apk add --no-cache tini curl

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Run the application with tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]