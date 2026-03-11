#!/bin/bash

# RescapeR Deployment Script
# This script manages the Docker deployment for development and production environments.

set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

ENV="${1:-dev}"

# Detect docker-compose or docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "🚀 RescapeR Deploy - ${ENV}"
echo "============================"

# Handle different environments
if [ "$ENV" == "prod" ]; then
    echo "⚠️  Production deployment"
    # In prod, we bind to port 80. Ensure it's not taken.
    COMPOSE_FILE="docker-compose.prod.yml"
    PORT="80"
    URL="http://localhost"
    
elif [ "$ENV" == "dev" ]; then
    echo "🔧 Development deployment"
    COMPOSE_FILE="docker-compose.yml"
    PORT="8080"
    URL="http://localhost:8080"
    
else
    echo "❌ Unknown environment: ${ENV}"
    echo "Usage: ./scripts/deploy.sh [dev|prod]"
    exit 1
fi

# Stop existing containers for the project to avoid conflicts
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans || true

# Build and start
echo "🏗️  Building and starting containers..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --build

echo ""
echo "✅ Deployment successful!"
echo "🌐 URL: ${URL}"
echo "📊 Logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"

echo ""
echo "🐳 Container status:"
docker ps --filter "name=rescaper"
