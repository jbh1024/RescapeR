# 🐳 RescapeR Deployment Guide

RescapeR 게임을 로컬 개발 환경 및 상용 서버(Docker)로 배포하는 방법을 안내합니다.

## 1. 로컬 개발 환경 (Local Development)

### **로컬 정적 서버 (간편 실행)**
```bash
npm run serve
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
./scripts/build-multiarch.sh v1.3.0 yourusername
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
  `./scripts/build-specific-platform.sh v1.3.0 linux/amd64 yourusername`

---

## 4. 🏗️ CI/CD 통합 (Jenkins)

Jenkins 프리스타일 job으로 CI/CD 파이프라인을 운영합니다.

### **Jenkins Job 구성**
| Job | 역할 | 트리거 |
|---|---|---|
| `rescaper-ci` | 의존성 설치 → 구문 체크 → Playwright E2E 테스트 (15개) | Push 시 자동 |
| `rescaper-deploy-prod` | 멀티 아키텍처 Docker 이미지 빌드 → Docker Hub Push | 수동 (VERSION 파라미터) |
| `rescaper-deploy-server` | Docker Hub에서 Pull → 프로덕션 서버 배포 | 수동 (VERSION 파라미터) |

### **Jenkins 환경 요구사항**
Jenkins Docker 컨테이너에는 다음이 설치되어야 합니다:
- Node.js 20.x, Docker CLI + Buildx 플러그인
- Playwright Chromium 의존성 (libglib2.0, libnss3 등)
- Docker 소켓 마운트 (`/var/run/docker.sock`)

### **버전 태그를 이용한 프로덕션 배포**
`docker-compose.prod.yml`은 환경변수 `RESCAPER_TAG`로 이미지 버전을 제어합니다:
```bash
# 특정 버전 배포
RESCAPER_TAG=v1.3.0 docker compose -f docker/docker-compose.prod.yml up -d

# 기본값(latest) 배포
docker compose -f docker/docker-compose.prod.yml up -d
```

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
RANKING_SECRET_KEY=$(openssl rand -base64 32) docker compose -f docker/docker-compose.yml up --build
```
*   게임 접속: `http://localhost:8080`

### **Docker를 이용한 프로덕션 배포**
서버에 `docker-compose.prod.yml` 파일만 배치한 후 Docker Hub에서 이미지를 pull하여 실행합니다.
```bash
# 특정 버전으로 배포
RESCAPER_TAG=v1.3.0 docker compose -f docker/docker-compose.prod.yml pull
RESCAPER_TAG=v1.3.0 docker compose -f docker/docker-compose.prod.yml up -d

# 최신 버전(latest)으로 배포
docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d
```
*   게임 접속: `http://localhost:4431` (호스트 Nginx가 SSL 프록시)
*   랭킹 API: 게임 컨테이너 내부 Nginx가 `/rescaper-api/`를 랭킹 서버로 프록시 (외부 미노출)

### **주요 설정 (Environment Variables)**
`server/.env.example`을 참고하여 `server/.env` 파일을 생성하고, Docker 환경에서는 `docker-compose.yml`의 `environment`로 설정합니다.
*   `RESCAPER_TAG`: Docker 이미지 버전 태그 (기본값: `latest`)
*   `PORT`: 서버 포트
*   `RANKING_SECRET_KEY`: **필수**. 서버 전용 HMAC 비밀키. 미설정 시 서버가 시작되지 않음
    ```bash
    # 강력한 키 생성
    openssl rand -base64 32
    ```
*   `CORS_ORIGINS`: 허용할 오리진 목록 (콤마 구분). 미설정 시 localhost만 허용
    ```yaml
    # docker-compose.prod.yml 예시
    - CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
    ```
*   `DB_PASSWORD`: 데이터베이스 비밀번호 (프로덕션에서는 반드시 강력한 값 사용)

> **주의**: `.env` 파일은 Git에 커밋하지 않습니다. `.env.example`만 참조용으로 커밋되어 있습니다.

---

## 📊 참고 정보
- **기본 이미지:** `nginx:alpine` (~23MB)
- **최종 이미지 크기:** 약 30-50MB
- **보안:** Nginx에 CSP, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy` 등 보안 헤더가 적용되어 있습니다. 클라이언트에도 CSP 메타 태그가 포함되어 있습니다. 서버에는 Rate Limiting(POST 5회/분, GET 30회/분), CORS 화이트리스트, 입력 검증이 적용되어 있습니다.
