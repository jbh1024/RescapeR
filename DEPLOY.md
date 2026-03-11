# 🐳 RescapeR Deployment Guide

RescapeR 게임을 로컬 개발 환경 및 상용 서버(Docker)로 배포하는 방법을 안내합니다.

## 1. 로컬 개발 환경 (Local Development)

### **Python HTTP Server (간편 실행)**
```bash
python3 -m http.server 8000
# 접속: http://localhost:8000/playable-web/
```

### **Docker (권장 환경)**
```bash
# 개발 모드 빌드 및 실행 (포트 8080)
./scripts/deploy.sh dev

# 프로덕션 모드 빌드 및 실행 (포트 80)
./scripts/deploy.sh prod
```

---

## 2. Docker Hub 배포 가이드

### **스크립트를 이용한 자동 배포**
```bash
# 최신 버전으로 배포
./scripts/deploy-dockerhub.sh

# 특정 버전 태그로 배포 (사용자명 명시)
./scripts/deploy-dockerhub.sh v1.1.0 yourusername
```

### **수동 배포 절차**
1. `docker login`
2. `docker build -t rescaper:v1.1.0 .`
3. `docker tag rescaper:v1.1.0 yourusername/rescaper:v1.1.0`
4. `docker push yourusername/rescaper:v1.1.0`

---

## 3. 멀티 아키텍처 빌드 (Multi-Arch Build)

### **지원 아키텍처**
- `linux/amd64` (Intel/AMD 서버, 클라우드 인스턴스)
- `linux/arm64` (Apple Silicon M1/M2/M3, Raspberry Pi, AWS Graviton)

### **빌드 스크립트 실행**
```bash
# AMD64 및 ARM64 모두를 지원하는 이미지 빌드 및 푸시
./scripts/build-multiarch.sh v1.1.0 yourusername
```

---

## 4. 🖥️ Docker 플랫폼 문제 해결 (Troubleshooting)

### **"exec format error" 발생 시**
이 오류는 빌드 아키텍처와 실행 서버 아키텍처가 다를 때 발생합니다 (예: Mac M1에서 빌드 후 Intel 서버에서 실행).
- **해결 1:** `build-multiarch.sh` 스크립트를 사용하여 빌드하십시오.
- **해결 2:** 특정 플랫폼을 명시하여 빌드하십시오.
  `./scripts/build-specific-platform.sh v1.1.0 linux/amd64 yourusername`

---

## 5. 🏗️ CI/CD 통합 (GitHub Actions)
`latest` 태그는 항상 최신 안정 버전을 가리키도록 관리됩니다. CI/CD 환경에서는 `platforms: linux/amd64,linux/arm64`를 명시하여 빌드하는 것을 권장합니다.

---

## 📊 참고 정보
- **기본 이미지:** `nginx:alpine` (~23MB)
- **최종 이미지 크기:** 약 30-50MB
- **보안:** Nginx 설정에 `X-Frame-Options`, `X-Content-Type-Options` 등 보안 헤더가 적용되어 있습니다.
