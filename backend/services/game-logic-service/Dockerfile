# Extend from base service image
FROM srt-8192/base-service:latest

# Switch to root to copy files
USER root

# Service-specific environment variables
ENV SERVICE_NAME=game-logic \
    PORT=5001

# Copy service-specific files
COPY . .

# Fix permissions for the new files
RUN chown -R appuser:appgroup /app

# Switch back to appuser
USER appuser

# Build and run are handled by base image