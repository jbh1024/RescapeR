#!/bin/bash

# RescapeR 멀티 아키텍처 Docker 빌드 스크립트
# ARM64와 AMD64 모두 지원하는 이미지 생성

set -e

TAG="${1:-latest}"
DOCKER_USER="${2:-}"
IMAGE_NAME="rescaper"

# Docker 사용자명 확인
if [ -z "$DOCKER_USER" ]; then
    if [ -f ".dockeruser" ]; then
        DOCKER_USER=$(cat .dockeruser)
    else
        echo "❌ 오류: Docker Hub 사용자명이 필요합니다"
        echo "사용법: ./build-multiarch.sh [태그] [도커허브사용자명]"
        exit 1
    fi
fi

echo "🐳 RescapeR 멀티 아키텍처 빌드"
echo "==============================="
echo "태그: $TAG"
echo "Docker Hub: $DOCKER_USER"
echo "플랫폼: linux/amd64, linux/arm64"
echo ""

# Docker Buildx 확인
echo "🔧 Docker Buildx 설정..."
if ! docker buildx inspect multiplatform-builder &>/dev/null; then
    echo "  → 새로운 builder 생성..."
    docker buildx create --name multiplatform-builder --driver docker-container --bootstrap
fi
docker buildx use multiplatform-builder

# 로그인 확인
echo ""
echo "🔐 Docker Hub 로그인 확인..."
if ! docker info | grep -q "Username"; then
    docker login
fi

# 멀티 플랫폼 빌드 및 푸시
echo ""
echo "📦 멀티 아키텍처 이미지 빌드 중..."
echo "  - linux/amd64 (x86_64 서버)"
echo "  - linux/arm64 (M1/M2 Mac, Raspberry Pi)"
echo ""

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "$DOCKER_USER/$IMAGE_NAME:$TAG" \
    --tag "$DOCKER_USER/$IMAGE_NAME:latest" \
    --push \
    .

echo ""
echo "✅ 멀티 아키텍처 빌드 완료!"
echo ""
echo "📎 지원 플랫폼:"
docker buildx imagetools inspect "$DOCKER_USER/$IMAGE_NAME:$TAG" | grep -A 5 "Platforms"
echo ""
echo "🧪 실행 테스트:"
echo "  AMD64 서버: docker run -p 8080:80 $DOCKER_USER/$IMAGE_NAME:$TAG"
echo "  ARM64 (M1): docker run -p 8080:80 $DOCKER_USER/$IMAGE_NAME:$TAG"
