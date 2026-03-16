#!/bin/bash

# RescapeR Docker Hub Deployment Script
# Usage: ./scripts/deploy-dockerhub.sh [tag] [dockerhub_username]

set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

# Default values
TAG="${1:-latest}"
DOCKER_USER="${2:-}"
IMAGE_NAME="rescaper"

echo "🐳 RescapeR Docker Hub Deploy"
echo "============================"

# Check for Docker username
if [ -z "$DOCKER_USER" ]; then
    # Check for saved username in project root
    if [ -f ".dockeruser" ]; then
        DOCKER_USER=$(cat .dockeruser)
        echo "✓ Using saved Docker username: $DOCKER_USER"
    else
        echo "Please enter your Docker Hub username:"
        read -r DOCKER_USER
        if [ -z "$DOCKER_USER" ]; then
            echo "❌ Error: Docker username is required."
            exit 1
        fi
        # Save username for future use (in project root)
        echo "$DOCKER_USER" > .dockeruser
        echo "✓ Username saved to .dockeruser"
    fi
fi

FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$TAG"
LATEST_NAME="$DOCKER_USER/$IMAGE_NAME:latest"

echo ""
echo "📋 Deployment Info:"
echo "  - Image: $IMAGE_NAME"
echo "  - Tag: $TAG"
echo "  - Docker Hub: $DOCKER_USER"
echo "  - Full Name: $FULL_IMAGE_NAME"
echo ""

# Check Docker login status
echo "🔐 Checking Docker Hub login..."
if ! docker info | grep -q "Username"; then
    echo "Login required for Docker Hub..."
    docker login
else
    echo "✓ Already logged in."
fi

# Build image
echo ""
echo "📦 Building image..."
docker build -t "$IMAGE_NAME:$TAG" -f docker/Dockerfile .

# Tag image
echo ""
echo "🏷️  Tagging image..."
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"
docker tag "$IMAGE_NAME:$TAG" "$LATEST_NAME"

echo "  ✓ $IMAGE_NAME:$TAG → $FULL_IMAGE_NAME"
echo "  ✓ $IMAGE_NAME:$TAG → $LATEST_NAME"

# Push image
echo ""
echo "🚀 Pushing to Docker Hub..."
echo "  → $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"

echo ""
echo "  → $LATEST_NAME"
docker push "$LATEST_NAME"

# Completion
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📎 Pull command:"
echo "  docker pull $FULL_IMAGE_NAME"
echo ""
echo "🌐 Docker Hub URL:"
echo "  https://hub.docker.com/r/$DOCKER_USER/$IMAGE_NAME"
echo ""
echo "🧪 Local test:"
echo "  docker run -p 8080:80 $FULL_IMAGE_NAME""
