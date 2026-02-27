#!/bin/bash

# RescapeR Docker Hub 배포 스크립트
# 사용법: ./deploy-dockerhub.sh [태그] [도커허브사용자명]

set -e

# 기본값 설정
TAG="${1:-latest}"
DOCKER_USER="${2:-}"
IMAGE_NAME="rescaper"

echo "🐳 RescapeR Docker Hub 배포"
echo "============================"

# Docker 사용자명 확인
if [ -z "$DOCKER_USER" ]; then
    # 저장된 사용자명 확인
    if [ -f ".dockeruser" ]; then
        DOCKER_USER=$(cat .dockeruser)
        echo "✓ 저장된 Docker 사용자명 사용: $DOCKER_USER"
    else
        echo "Docker Hub 사용자명을 입력하세요:"
        read -r DOCKER_USER
        if [ -z "$DOCKER_USER" ]; then
            echo "❌ 오류: Docker 사용자명이 필요합니다"
            exit 1
        fi
        # 사용자명 저장 (선택사항)
        echo "$DOCKER_USER" > .dockeruser
        echo "✓ 사용자명 저장됨 (.dockeruser)"
    fi
fi

FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$TAG"
LATEST_NAME="$DOCKER_USER/$IMAGE_NAME:latest"

echo ""
echo "📋 배포 정보:"
echo "  - 이미지: $IMAGE_NAME"
echo "  - 태그: $TAG"
echo "  - Docker Hub: $DOCKER_USER"
echo "  - 전체 이름: $FULL_IMAGE_NAME"
echo ""

# Docker 로그인 상태 확인
echo "🔐 Docker Hub 로그인 확인..."
if ! docker info | grep -q "Username"; then
    echo "Docker Hub에 로그인이 필요합니다"
    docker login
else
    echo "✓ 이미 로그인되어 있습니다"
fi

# 이미지 빌드
echo ""
echo "📦 이미지 빌드 중..."
docker build -t "$IMAGE_NAME:$TAG" .

# 태그 설정
echo ""
echo "🏷️  태그 설정..."
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"
docker tag "$IMAGE_NAME:$TAG" "$LATEST_NAME"

echo "  ✓ $IMAGE_NAME:$TAG → $FULL_IMAGE_NAME"
echo "  ✓ $IMAGE_NAME:$TAG → $LATEST_NAME"

# 이미지 푸시
echo ""
echo "🚀 Docker Hub로 푸시 중..."
echo "  → $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"

echo ""
echo "  → $LATEST_NAME"
docker push "$LATEST_NAME"

# 완료
echo ""
echo "✅ 배포 완료!"
echo ""
echo "📎 이미지 주소:"
echo "  docker pull $FULL_IMAGE_NAME"
echo ""
echo "🌐 Docker Hub:"
echo "  https://hub.docker.com/r/$DOCKER_USER/$IMAGE_NAME"
echo ""
echo "🧪 로컬 테스트:"
echo "  docker run -p 8080:80 $FULL_IMAGE_NAME"
