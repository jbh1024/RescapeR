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

## 2. Docker Hub 배포 가이드 (Multi-Architecture)

게임 클라이언트(`rescaper`)와 랭킹 서버(`rescaper-ranking`) 두 이미지를 멀티 아키텍처(amd64 + arm64)로 빌드하여 Docker Hub에 푸시합니다.

### **지원 아키텍처**
- `linux/amd64` (Intel/AMD 서버, 클라우드 인스턴스)
- `linux/arm64` (Apple Silicon M1/M2/M3, Raspberry Pi, AWS Graviton)

### **배포 스크립트 실행**
```bash
# 최신 버전으로 배포
./scripts/build-multiarch.sh

# 특정 버전 태그로 배포 (사용자명 명시)
./scripts/build-multiarch.sh v1.2.1 yourusername
```

### **배포되는 이미지**
| 이미지 | 설명 |
|---|---|
| `yourusername/rescaper:tag` | 게임 클라이언트 (Nginx + 난독화 JS) |
| `yourusername/rescaper-ranking:tag` | 랭킹 API 서버 (Node.js + SQLite) |

---

## 3. 🖥️ Docker 플랫폼 문제 해결 (Troubleshooting)

### **"exec format error" 발생 시**
이 오류는 빌드 아키텍처와 실행 서버 아키텍처가 다를 때 발생합니다 (예: Mac M1에서 빌드 후 Intel 서버에서 실행).
- **해결 1:** `build-multiarch.sh` 스크립트를 사용하여 빌드하십시오.
- **해결 2:** 특정 플랫폼을 명시하여 빌드하십시오.
  `./scripts/build-specific-platform.sh v1.2.1 linux/amd64 yourusername`

---

## 4. 🏗️ CI/CD 통합 (GitHub Actions)
`latest` 태그는 항상 최신 안정 버전을 가리키도록 관리됩니다. CI/CD 환경에서는 `platforms: linux/amd64,linux/arm64`를 명시하여 빌드하는 것을 권장합니다.

---

## 5. 🏆 글로벌 랭킹 시스템 서버 (Ranking System Backend)

게임의 글로벌 랭킹을 관리하는 Node.js 서버 설정 및 실행 방법입니다.

### **로컬 실행 (Local Development)**
서버 디렉토리에서 의존성을 설치하고 직접 실행합니다.
```bash
cd server
npm install
node index.js
```
*   **포트**: 기본값 `3000` (환경 변수 `PORT`로 변경 가능)
*   **데이터베이스**: `server/ranking.db` (SQLite) 파일에 자동 저장됩니다.

### **Docker 로컬 빌드 (개발용)**
로컬 소스 코드에서 직접 빌드하여 실행합니다.
```bash
docker compose -f docker/docker-compose.yml up --build
```
*   게임 접속: `http://localhost:8080`

### **Docker를 이용한 프로덕션 배포**
서버에 `docker-compose.prod.yml` 파일만 배치한 후 Docker Hub에서 이미지를 pull하여 실행합니다.
```bash
# 이미지 pull 및 실행
docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d
```
*   게임 접속: `http://localhost:4431` (호스트 Nginx가 SSL 프록시)
*   랭킹 API: 게임 컨테이너 내부 Nginx가 `/rescaper-api/`를 랭킹 서버로 프록시 (외부 미노출)

### **주요 설정 (Environment Variables)**
`docker-compose.yml`의 `environment` 또는 `server/.env` 파일을 통해 설정을 관리합니다.
*   `PORT`: 서버 포트
*   `RANKING_SECRET_KEY`: 클라이언트와 서버 간 데이터 무결성 검증을 위한 HMAC 비밀키 (보안을 위해 반드시 변경 권장)

---

## 📊 참고 정보
- **기본 이미지:** `nginx:alpine` (~23MB)
- **최종 이미지 크기:** 약 30-50MB
- **보안:** Nginx 설정에 `X-Frame-Options`, `X-Content-Type-Options` 등 보안 헤더가 적용되어 있습니다.
