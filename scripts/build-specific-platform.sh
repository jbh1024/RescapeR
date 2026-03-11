#!/bin/bash

# RescapeR Build Image for Specific Platform
# Usage: ./scripts/build-specific-platform.sh [tag] [platform] [dockerhub_username]

set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

TAG="${1:-latest}"
PLATFORM="${2:-linux/amd64}"
DOCKER_USER="${3:-}"
IMAGE_NAME="rescaper"

# Docker Hub username confirmation
if [ -z "$DOCKER_USER" ]; then
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

echo "🐳 RescapeR Specific Platform Build"
echo "============================"
echo "Tag: $TAG"
echo "Platform: $PLATFORM"
echo "Docker Hub: $DOCKER_USER"
echo ""

# Buildx setup
echo "🔧 Configuring Docker Buildx..."
if ! docker buildx inspect single-platform-builder &>/dev/null; then
    echo "  → Creating new builder..."
    docker buildx create --name single-platform-builder --driver docker-container --bootstrap
fi
docker buildx use single-platform-builder

# Login confirmation
echo "🔐 Checking Docker Hub login..."
if ! docker info | grep -q "Username"; then
    echo "Login required for Docker Hub..."
    docker login
fi

# Build for specific platform
echo ""
echo "📦 Building image for $PLATFORM..."
docker buildx build \
    --platform "$PLATFORM" \
    --tag "$DOCKER_USER/$IMAGE_NAME:$TAG" \
    --push \
    .

echo ""
echo "✅ Build complete: $DOCKER_USER/$IMAGE_NAME:$TAG ($PLATFORM)""
