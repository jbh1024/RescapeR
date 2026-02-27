# 🖥️ Docker 플랫폼 아키텍처 가이드

## ❌ 문제 상황

```
WARNING: The requested image's platform (linux/arm64/v8) does not match 
the detected host platform (linux/amd64/v3) and no specific platform was requested
exec /docker-entrypoint.sh: exec format error
```

### 원인
- **빌드 환경**: ARM64 (M1/M2 Mac, Apple Silicon)
- **실행 환경**: AMD64 (x86_64, Intel/AMD 서버)
- CPU 아키텍처가 달라서 바이너리를 실행할 수 없음

---

## ✅ 해결 방법

### 방법 1: 멀티 아키텍처 빌드 (권장 ⭐)

한 번의 빌드로 여러 아키텍처를 지원:

```bash
# 멀티 아키텍처 빌드 스크립트 실행
./scripts/build-multiarch.sh v1.0.7 yourusername
```

**지원 플랫폼:**
- `linux/amd64` - Intel/AMD 서버 (AWS, GCP, Azure 등)
- `linux/arm64` - Apple Silicon (M1/M2), Raspberry Pi, AWS Graviton

---

### 방법 2: 서버에서 직접 빌드

```bash
# 1. 서버에 코드 복사 (git clone 또는 scp)
ssh your-server
cd /path/to/rescaper

# 2. 서버에서 직접 빌드 (자동으로 AMD64로 빌드됨)
docker build -t rescaper:latest .

# 3. 실행
docker run -d -p 80:80 rescaper:latest
```

---

### 방법 3: 특정 플랫폼으로 빌드

```bash
# AMD64 전용으로 빌드
./scripts/build-specific-platform.sh v1.0.7 linux/amd64 yourusername

# ARM64 전용으로 빌드  
./scripts/build-specific-platform.sh v1.0.7 linux/arm64 yourusername
```

---

### 방법 4: docker-compose에서 플랫폼 지정

```yaml
services:
  rescaper:
    image: yourusername/rescaper:latest
    platform: linux/amd64  # 특정 플랫폼 강제
    ports:
      - "80:80"
```

---

## 📊 아키텍처 비교

| 환경 | 아키텍처 | 확인 방법 |
|------|----------|-----------|
| Intel/AMD PC/서버 | `linux/amd64` | `uname -m` → x86_64 |
| Apple M1/M2/M3 | `linux/arm64` | `uname -m` → arm64 |
| Raspberry Pi 4 | `linux/arm64` | `uname -m` → aarch64 |
| AWS t3/m5 | `linux/amd64` | - |
| AWS t4g/m6g | `linux/arm64` | - |

---

## 🔍 현재 환경 확인

### 빌드 환경 확인
```bash
# 현재 시스템 아키텍처
uname -m

# Docker 기본 플랫폼
docker info | grep Architecture
```

### 이미지 아키텍처 확인
```bash
# 이미지가 지원하는 플랫폼 확인
docker manifest inspect yourusername/rescaper:latest

# 또는
docker buildx imagetools inspect yourusername/rescaper:latest
```

---

## 🚀 멀티 아키텍처 사용법

### 1. 빌드 (로컬 Mac 또는 CI)

```bash
# 멀티 아키텍처 빌더 생성 (처음 한 번)
docker buildx create --name multiplatform --driver docker-container --use

# 빌드 및 푸시
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag yourusername/rescaper:latest \
  --push .
```

### 2. 어디서든 실행

```bash
# 서버 (AMD64) - 자동으로 amd64 이미지 사용
docker run -p 8080:80 yourusername/rescaper:latest

# Mac (ARM64) - 자동으로 arm64 이미지 사용  
docker run -p 8080:80 yourusername/rescaper:latest
```

Docker가 **자동으로** 호스트 플랫폼에 맞는 이미지를 선택합니다.

---

## 🛠️ 수동 실행 (플랫폼 강제 지정)

### AMD64 이미지를 ARM64에서 실행 (에뮬레이션, 느림)
```bash
docker run --platform linux/amd64 -p 8080:80 yourusername/rescaper:latest
```

### ARM64 이미지를 AMD64에서 실행 (에뮬레이션, 느림)
```bash
docker run --platform linux/arm64 -p 8080:80 yourusername/rescaper:latest
```

⚠️ **주의**: 에뮬레이션은 성능이 크게 저하됩니다. 가능하면 네이티브 아키텍처를 사용하세요.

---

## 📋 빠른 해결 체크리스트

1. **지금 당장 해결** → 서버에서 직접 빌드 (방법 2)
2. **장기적 해결** → 멀티 아키텍처 빌드 설정 (방법 1)
3. **CI/CD 사용** → GitHub Actions에서 멀티 아키텍처 빌드

---

## 🔧 GitHub Actions 멀티 아키텍처 예시

```yaml
# .github/workflows/docker-hub.yml
name: Multi-Platform Docker Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/rescaper:latest
            ${{ secrets.DOCKER_USERNAME }}/rescaper:${{ github.ref_name }}
```

---

## 💡 팁

1. **개발**: 로컬에서 빠른 빌드
2. **배포**: 멀티 아키텍처 이미지 사용
3. **서버**: 아키텍처에 맞는 이미지 자동 선택

---

## 🆘 여전히 안 되나요?

```bash
# 1. 이미지 강제 삭제
docker rmi -f yourusername/rescaper:latest

# 2. 캐시 클리어
docker system prune -f

# 3. 다시 pull (자동으로 맞는 아키텍처 선택)
docker pull yourusername/rescaper:latest

# 4. 플랫폼 명시적으로 실행
docker run --platform linux/amd64 -p 8080:80 yourusername/rescaper:latest
```
