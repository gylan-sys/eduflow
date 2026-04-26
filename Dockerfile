# Use Node.js as the base image
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Final stage
FROM node:22-slim

WORKDIR /app

# Copy production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# Install only production dependencies
# Note: we still need packages for server.ts if we run it directly
RUN npm install --omit=dev

# Install tsx globally or locally to run server.ts if needed, 
# although node 22 supports it, sometimes it needs flags or specific setup.
# The framework says 'node server.ts' works.

# Create data and uploads directory for persistence
RUN mkdir -p /app/uploads

# Expose port 3000
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "--experimental-strip-types", "server.ts"]
