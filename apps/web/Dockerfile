# Dockerfile for Frontend (Next.js)
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy workspace package manifests
COPY package*.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/

# Install dependencies for the entire workspace
RUN npm ci

# Copy source code
COPY packages/db ./packages/db
COPY apps/web ./apps/web

# Build the DB package (workspace dependency) and Next.js web app
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/web

# Production runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy root manifest and built node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy database workspace built files
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/dist ./packages/db/dist

# Copy web workspace
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

EXPOSE 3000

# Start Next.js using root workspace command
CMD ["npm", "run", "start", "--workspace=apps/web"]
