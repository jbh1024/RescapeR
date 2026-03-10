# 🐳 RescapeR Docker 배포 가이드

RescapeR 게임을 Docker 컨테이너로 빌드하고 배포하는 방법을 안내합니다.

## 📋 사전 요구사항

- Docker 20.10+
- Docker Compose 2.0+ (선택사항)

## 🚀 빠른 시작

### 1. 이미지 빌드 및 실행

```bash
# Docker 이미지 빌드
docker build -t rescaper:latest .

# 컨테이너 실행
docker run -d -p 8080:80 --name rescaper-game rescaper:latest

# 브라우저에서 접속
open http://localhost:8080
```

### 2. 스크립트 사용 (권장)

```bash
# 개발 환경 배포 (포트 8080)
./scripts/deploy.sh dev

# 프로덕션 환경 배포 (포트 80)
./scripts/deploy.sh prod
```

### 3. Docker Compose 사용

```bash
# 개발 환경
docker-compose up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

## 🏗️ 이미지 빌드

### 기본 빌드
```bash
docker build -t rescaper:latest .
```

### 특정 태그로 빌드
```bash
./scripts/build-docker.sh v1.1.0
```

### 레지스트리 푸시 (Docker Hub, AWS ECR 등)
```bash
# Docker Hub 예시
./scripts/build-docker.sh v1.1.0 yourusername

# 또는 수동으로
docker build -t rescaper:v1.1.0 .
docker tag rescaper:v1.1.0 yourusername/rescaper:v1.1.0
docker push yourusername/rescaper:v1.1.0
```

## ⚙️ 환경 설정

### 개발 환경 (docker-compose.yml)
- 포트: 8080
- 볼륨 마운트: 코드 변경 시 자동 반영 (주석 해제 후 사용)
- 디버깅 용이

### 프로덕션 환경 (docker-compose.prod.yml)
- 포트: 80
- 리소스 제한: CPU 0.5, 메모리 128MB
- 자동 재시작: always
- 로그 로테이션: 10MB × 3개

## 🔧 환경변수

필요한 경우 `docker-compose.yml`에 환경변수를 추가할 수 있습니다:

```yaml
services:
  rescaper:
    environment:
      - NGINX_WORKER_PROCESSES=auto
      - NGINX_WORKER_CONNECTIONS=1024
```

## 📁 볼륨 마운트

개발 시에만 사용하세요:

```yaml
volumes:
  - ./playable-web:/usr/share/nginx/html:ro
```

## 🔒 보안

Nginx 설정에 포함된 보안 헤더:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

## 📊 모니터링

### Health Check
컨테이너는 30초 간격으로 헬스체크를 수행합니다:
```bash
docker inspect --format='{{.State.Health.Status}}' rescaper-game
```

### 리소스 사용량
```bash
docker stats rescaper-game
```

## 🌐 HTTPS 배포 (프로덕션)

### 방법 1: Reverse Proxy (권장)
`docker-compose.yml`의 nginx-proxy 섹션 주석을 해제하고 사용하세요.

### 방법 2: Cloudflare Tunnel
```bash
docker run -d cloudflare/cloudflared:latest tunnel --no-autoupdate run --token YOUR_TOKEN
```

### 방법 3: Let's Encrypt
```yaml
# docker-compose.yml에 추가
  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
```

## 🐛 문제 해결

### 컨테이너 로그 확인
```bash
docker logs rescaper-game
docker logs -f rescaper-game  # 실시간
```

### 컨테이너 쉘 접속
```bash
docker exec -it rescaper-game sh
```

### 이미지 크기 확인
```bash
docker images rescaper:latest
```

### 네트워크 문제
```bash
# 컨테이너 IP 확인
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' rescaper-game

# 포트 매핑 확인
docker port rescaper-game
```

## 📦 이미지 최적화

### 멀티 스테이지 빌드 (선택사항)
더 작은 이미지를 원하면 다음을 `Dockerfile`에 추가하세요:

```dockerfile
# 빌드 단계
FROM node:18-alpine AS builder
WORKDIR /app
COPY playable-web/ .
# 추가 빌드 작업...

# 실행 단계
FROM nginx:alpine
COPY --from=builder /app /usr/share/nginx/html
```

### 이미지 크기 비교
```bash
# 기본 이미지 크기
docker images nginx:alpine

# Rescaper 이미지 크기
docker images rescaper:latest
```

## 🔄 CI/CD 통합

### GitHub Actions 예시

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t rescaper:${{ github.ref_name }} .
      
      - name: Push to Docker Hub
        if: startsWith(github.ref, 'refs/tags/')
        run: |
          echo ${{ secrets.DOCKER_TOKEN }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag rescaper:${{ github.ref_name }} ${{ secrets.DOCKER_USERNAME }}/rescaper:${{ github.ref_name }}
          docker push ${{ secrets.DOCKER_USERNAME }}/rescaper:${{ github.ref_name }}
```

## 📚 참고

- 기본 이미지: `nginx:alpine` (~23MB)
- 예상 총 이미지 크기: ~30-50MB
- 지원 아키텍처: `linux/amd64`, `linux/arm64`

---

💡 **팁**: 개발 시에는 `./scripts/deploy.sh dev`를, 프로덕션 배포 시에는 `./scripts/deploy.sh prod`를 사용하세요.
