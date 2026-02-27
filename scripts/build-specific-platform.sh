#!/bin/bash

# RescapeR 특정 플랫폼용 이미지 빌드
# 사용법: ./build-specific-platform.sh [태그] [플랫폼] [도커허브사용자명]

set -e

TAG="${1:-latest}"
PLATFORM="${2:-linux/amd64}"
DOCKER_USER="${3:-}"
IMAGE_NAME="rescaper"

# Docker 사용자명 확인
if [ -z "$DOCKER_USER" ]; then
    if [ -f ".dockeruser" ]; then
        DOCKER_USER=$(cat .dockeruser)
    else
        echo "Docker Hub 사용자명을 입력하세요:"
        read -r DOCKER_USER
        [ -z "$DOCKER_USER" ] && exit 1
        echo "$DOCKER_USER" > .dockeruser
    fi
fi

echo "🐳 RescapeR 특정 플랫폼 빌드"
echo "============================"
echo "태그: $TAG"
echo "플랫폼: $PLATFORM"
echo "Docker Hub: $DOCKER_USER"
echo ""

# Buildx 사용
docker buildx create --use --name single-platform-builder 2>/dev/null || docker buildx use single-platform-builder

# 특정 플랫폼으로 빌드
echo "📦 이미지 빌드 중..."
docker buildx build \
    --platform "$PLATFORM" \
    --tag "$DOCKER_USER/$IMAGE_NAME:$TAG" \
    --push \
    .

echo ""
echo "✅ 빌드 완료: $DOCKER_USER/$IMAGE_NAME:$TAG ($PLATFORM)"
