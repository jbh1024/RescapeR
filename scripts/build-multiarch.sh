#!/bin/bash

# RescapeR Docker Hub Deployment Script (Multi-Architecture)
# Builds and pushes both game client and ranking server images for ARM64 and AMD64.
# Usage: ./scripts/build-multiarch.sh [tag] [dockerhub_username]

set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

# Default values
TAG="${1:-latest}"
DOCKER_USER="${2:-}"
GAME_IMAGE="rescaper"
RANKING_IMAGE="rescaper-ranking"

echo "🐳 RescapeR Docker Hub Deploy (Multi-Architecture)"
echo "===================================================="

# Check for Docker username
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
        echo "$DOCKER_USER" > .dockeruser
        echo "✓ Username saved to .dockeruser"
    fi
fi

echo ""
echo "📋 Deployment Info:"
echo "  - Game Image:    $DOCKER_USER/$GAME_IMAGE:$TAG"
echo "  - Ranking Image: $DOCKER_USER/$RANKING_IMAGE:$TAG"
echo "  - Platforms:     linux/amd64, linux/arm64"
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

# ==========================================
# 1. Game Client Image
# ==========================================
echo ""
echo "=========================================="
echo "📦 [1/2] Building game client (multi-arch)..."
echo "=========================================="

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file docker/Dockerfile \
    --tag "$DOCKER_USER/$GAME_IMAGE:$TAG" \
    --tag "$DOCKER_USER/$GAME_IMAGE:latest" \
    --push \
    .

# ==========================================
# 2. Ranking Server Image
# ==========================================
echo ""
echo "=========================================="
echo "📦 [2/2] Building ranking server (multi-arch)..."
echo "=========================================="

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --file server/Dockerfile \
    --tag "$DOCKER_USER/$RANKING_IMAGE:$TAG" \
    --tag "$DOCKER_USER/$RANKING_IMAGE:latest" \
    --push \
    ./server

# ==========================================
# Completion
# ==========================================
echo ""
echo "✅ All images deployed!"
echo ""
echo "📎 Pull commands:"
echo "  docker pull $DOCKER_USER/$GAME_IMAGE:$TAG"
echo "  docker pull $DOCKER_USER/$RANKING_IMAGE:$TAG"
echo ""
echo "🌐 Docker Hub:"
echo "  https://hub.docker.com/r/$DOCKER_USER/$GAME_IMAGE"
echo "  https://hub.docker.com/r/$DOCKER_USER/$RANKING_IMAGE"
echo ""
echo "🚀 Server deploy:"
echo "  docker compose -f docker/docker-compose.yml pull && docker compose -f docker/docker-compose.yml up -d"
