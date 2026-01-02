# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables with defaults
ARG VITE_FIREBASE_API_KEY=AIzaSyCo-ZpW14aW_QViQz1bjH1M6MmZ6nrKHbA
ARG VITE_FIREBASE_AUTH_DOMAIN=galileo-67aeb.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=galileo-67aeb
ARG VITE_FIREBASE_STORAGE_BUCKET=galileo-67aeb.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=256034508970
ARG VITE_FIREBASE_APP_ID=1:256034508970:web:1edeabdc7fcc63b77180d3
ARG VITE_API_URL=/api

# Set environment variables for build
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
