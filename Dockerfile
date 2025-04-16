# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies (use npm ci for clean install based on lock file)
# If you use yarn, replace with: COPY yarn.lock ./ && yarn install --frozen-lockfile
RUN npm ci

# Copy the rest of the application code
COPY . .

# Set NEXT_TELEMETRY_DISABLED to avoid telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
# Ensure your next.config.js has output: 'standalone' for this Dockerfile to work best
RUN npm run build

# Prune development dependencies (already done by standalone, but keep for safety if standalone isn't used)
# RUN npm prune --production 
# Note: If using output: 'standalone', this prune might not be necessary as standalone copies minimal node_modules

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV production
# Prevent Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./

# Copy the static assets separately (they are NOT included in standalone)
COPY --from=builder /app/.next/static ./.next/static/

# Copy public assets
COPY --from=builder /app/public ./public/

# Expose the port the app runs on (default for Next.js is 3000)
EXPOSE 3000

# Set the port environment variable (optional, but good practice)
ENV PORT 3000

# Set the command to start the application
# The standalone output includes a server.js file
CMD ["node", "server.js"] 