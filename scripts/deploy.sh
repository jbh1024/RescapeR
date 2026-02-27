#!/bin/bash

# RescapeR Deployment Script

set -e

ENV="${1:-dev}"

echo "🚀 RescapeR Deploy - ${ENV}"
echo "============================"

if [ "$ENV" == "prod" ]; then
    echo "⚠️  Production deployment"
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo ""
    echo "✅ Production deployed!"
    echo "🌐 http://localhost"
    
elif [ "$ENV" == "dev" ]; then
    echo "🔧 Development deployment"
    docker-compose down
    docker-compose up -d --build
    
    echo ""
    echo "✅ Development deployed!"
    echo "🌐 http://localhost:8080"
    echo ""
    echo "📊 Logs: docker-compose logs -f"
    
else
    echo "❌ Unknown environment: ${ENV}"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi

echo ""
echo "🐳 Container status:"
docker ps | grep rescaper || true
