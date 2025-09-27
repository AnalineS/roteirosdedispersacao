FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application for standalone output with optimizations
ENV BUILD_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output correctly for monorepo structure
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port (Next.js default port)
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=${PORT:-3000}

# Health check que valida Next.js server real
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const http = require('http'); const options = {hostname: 'localhost', port: process.env.PORT || 3000, path: '/', timeout: 5000}; const req = http.request(options, (res) => {process.exit(res.statusCode === 200 ? 0 : 1)}); req.on('error', () => process.exit(1)); req.on('timeout', () => {req.destroy(); process.exit(1)}); req.end();" || exit 1

# Create startup script to find and run server.js
RUN echo '#!/bin/sh\n\
echo "🔍 Diagnostic: Searching for server.js..."\n\
echo "📁 Current directory: $(pwd)"\n\
echo "📁 Directory contents:"\n\
ls -la\n\
echo "📁 Looking for server.js files:"\n\
find . -name "server.js" -type f 2>/dev/null || echo "No server.js found"\n\
\n\
# Try different locations for server.js\n\
if [ -f "./apps/frontend-nextjs/server.js" ]; then\n\
  echo "✅ Found server.js at ./apps/frontend-nextjs/server.js"\n\
  exec node ./apps/frontend-nextjs/server.js\n\
elif [ -f "./server.js" ]; then\n\
  echo "✅ Found server.js at ./server.js"\n\
  exec node ./server.js\n\
elif [ -f "/app/apps/frontend-nextjs/server.js" ]; then\n\
  echo "✅ Found server.js at /app/apps/frontend-nextjs/server.js"\n\
  exec node /app/apps/frontend-nextjs/server.js\n\
else\n\
  echo "❌ server.js not found in any expected location"\n\
  echo "📁 Full directory structure:"\n\
  find . -type f -name "*.js" | head -20\n\
  exit 1\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Command that runs the startup script
CMD ["/app/start.sh"]
