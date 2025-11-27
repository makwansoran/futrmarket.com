FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --no-fund --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 8787

# Start server
CMD ["node", "server.cjs"]
