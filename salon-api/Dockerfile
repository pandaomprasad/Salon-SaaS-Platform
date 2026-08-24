# ============================================================
# SALON API — MULTI-STAGE PRODUCTION DOCKERFILE
# ============================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Slim Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=6969

# Copy production node_modules and application code
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 6969

CMD ["node", "src/app.js"]
