FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (without cache to avoid lock issues)
RUN npm ci --no-audit --no-fund --prefer-offline=false

# Copy application files
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-8787}

# Start server
CMD ["node", "server.cjs"]
