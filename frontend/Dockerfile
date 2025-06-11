# Base stage
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy all the necessary files
COPY . .

# Set the appropriate ownership and permissions
RUN chown -R node:node /app

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Builder stage
FROM base AS builder
USER node
RUN \
  if [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Development stage
FROM base AS development
USER node

# Start app in development mode
ENV NODE_ENV development
CMD npm run dev

# Production stage
FROM builder AS production
USER node
ENV NODE_ENV production
EXPOSE 3000
ENV PORT 3000
CMD npm run start
