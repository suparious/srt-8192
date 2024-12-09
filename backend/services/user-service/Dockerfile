# Extend from base service image
FROM srt-8192/base-service:latest

# Service-specific environment variables
ENV SERVICE_NAME=user \
    PORT=5013

# Copy service-specific files
COPY . .

# Build and run are handled by base image