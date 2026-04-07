# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_USE_MOCK_DATA=false
ARG VITE_API_ENDPOINT=http://localhost:8000

# Set environment variables for build
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA
ENV VITE_API_ENDPOINT=$VITE_API_ENDPOINT

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
