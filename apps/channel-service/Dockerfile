# Dockerfile for Backend (Express Channel Service)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency configs
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript
RUN npx tsc

# Production runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root manifest and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Start the compiled JS application
CMD ["node", "dist/index.js"]
