#!/bin/bash

# RescapeR Docker Build Script

set -e

IMAGE_NAME="rescaper"
TAG="${1:-latest}"
REGISTRY="${2:-}"

echo "🎮 RescapeR Docker Build"
echo "========================"
echo "Image: ${IMAGE_NAME}:${TAG}"
echo ""

# Docker 이미지 빌드
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:${TAG} .

# 레지스트리가 제공된 경우 태그 추가 및 푸시
if [ -n "$REGISTRY" ]; then
    echo ""
    echo "📤 Tagging for registry..."
    docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}
    
    echo ""
    echo "🚀 Pushing to registry..."
    docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
    echo ""
    echo "✅ Pushed: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
else
    echo ""
    echo "✅ Built: ${IMAGE_NAME}:${TAG}"
fi

echo ""
echo "🧪 Test locally:"
echo "   docker run -p 8080:80 ${IMAGE_NAME}:${TAG}"
echo ""
echo "🌐 Open: http://localhost:8080"
