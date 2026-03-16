#!/bin/bash

# RescapeR Multi-Architecture Docker Build Script
# Creates an image that supports both ARM64 and AMD64.
# Usage: ./scripts/build-multiarch.sh [tag] [dockerhub_username]

set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

TAG="${1:-latest}"
DOCKER_USER="${2:-}"
IMAGE_NAME="rescaper"

# Docker Hub username confirmation
if [ -z "$DOCKER_USER" ]; then
    if [ -f ".dockeruser" ]; then
        DOCKER_USER=$(cat .dockeruser)
    else
        echo "❌ Error: Docker Hub username is required."
        echo "Usage: ./scripts/build-multiarch.sh [tag] [dockerhub_username]"
        exit 1
    fi
fi

echo "🐳 RescapeR Multi-Architecture Build"
echo "==============================="
echo "Tag: $TAG"
echo "Docker Hub: $DOCKER_USER"
echo "Platforms: linux/amd64, linux/arm64"
echo ""

# Docker Buildx configuration
echo "🔧 Configuring Docker Buildx..."
if ! docker buildx inspect multiplatform-builder &>/dev/null; then
    echo "  → Creating new builder..."
    docker buildx create --name multiplatform-builder --driver docker-container --bootstrap
fi
docker buildx use multiplatform-builder

# Login confirmation
echo ""
echo "🔐 Checking Docker Hub login..."
if ! docker info | grep -q "Username"; then
    echo "Login required for Docker Hub..."
    docker login
else
    echo "✓ Already logged in."
fi

# Multi-platform build and push
echo ""
echo "📦 Building multi-architecture image..."
echo "  - linux/amd64 (x86_64 servers)"
echo "  - linux/arm64 (M1/M2/M3 Mac, Raspberry Pi, AWS Graviton)"
echo ""

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file docker/Dockerfile \
    --tag "$DOCKER_USER/$IMAGE_NAME:$TAG" \
    --tag "$DOCKER_USER/$IMAGE_NAME:latest" \
    --push \
    .

echo ""
echo "✅ Multi-architecture build complete!"
echo ""
echo "📎 Supported Platforms:"
docker buildx imagetools inspect "$DOCKER_USER/$IMAGE_NAME:$TAG" | grep -A 5 "Platforms"
echo ""
echo "🧪 Running tests:"
echo "  AMD64 Server: docker run -p 8080:80 $DOCKER_USER/$IMAGE_NAME:$TAG"
echo "  ARM64 (M1/M2/M3): docker run -p 8080:80 $DOCKER_USER/$IMAGE_NAME:$TAG""
