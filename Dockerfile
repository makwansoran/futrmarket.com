FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (lock file includes devDependencies)
RUN npm ci --no-audit --no-fund

# Copy application files
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-8787}

# Start server
CMD ["node", "server.cjs"]
