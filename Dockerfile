# Small official Node image, same major version as local dev and CI
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy only what the app needs to run
COPY server.js ./
COPY db ./db
COPY routes ./routes
COPY public ./public

# Links the image to the repo on GitHub Container Registry
LABEL org.opencontainers.image.source="https://github.com/SWE40006-CL09-G02/SWE40006-CL09-Project-1"

# Run as the non-root user built into the image
USER node

EXPOSE 3000

# Every 30s, call /health (which also checks the database).
# 3 failures in a row mark the container "unhealthy" in `docker ps`.
# start-period gives the app 10s to boot. This only reports status.
# Using wget, as Alpine has wget, not curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "server.js"]