# 🐳 Docker Hub 배포 가이드

RescapeR 이미지를 Docker Hub에 배포하는 방법입니다.

## 📋 사전 준비

1. [Docker Hub](https://hub.docker.com) 계정 생성
2. Docker Desktop 설치 및 로그인

## 🚀 빠른 배포

### 방법 1: 스크립트 사용 (권장)

```bash
# 최신 버전으로 배포
./scripts/deploy-dockerhub.sh

# 특정 버전 태그로 배포
./scripts/deploy-dockerhub.sh v1.0.7

# 사용자명 직접 지정
./scripts/deploy-dockerhub.sh v1.0.7 yourusername
```

### 방법 2: 수동 배포

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 빌드
docker build -t rescaper:v1.0.7 .

# 3. 태그 설정 (yourusername을 본인 계정으로 변경)
docker tag rescaper:v1.0.7 yourusername/rescaper:v1.0.7
docker tag rescaper:v1.0.7 yourusername/rescaper:latest

# 4. 푸시
docker push yourusername/rescaper:v1.0.7
docker push yourusername/rescaper:latest
```

## 📊 배포 확인

### Docker Hub 웹사이트
```
https://hub.docker.com/r/yourusername/rescaper
```

### CLI로 확인
```bash
# 이미지 검색
docker search yourusername/rescaper

# 이미지 다운로드 테스트
docker pull yourusername/rescaper:latest
```

## 🌍 다른 환경에서 실행

Docker Hub에 배포 후, 어디서든 실행 가능합니다:

```bash
# 로컬
docker run -p 8080:80 yourusername/rescaper:latest

# 서버
docker run -d -p 80:80 --name rescaper yourusername/rescaper:latest

# ARM64 (M1/M2 Mac, Raspberry Pi)
docker run -p 8080:80 --platform linux/arm64 yourusername/rescaper:latest
```

## 🔄 자동 배포 (GitHub Actions)

### GitHub Secrets 설정
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. 다음 Secrets 추가:
   - `DOCKER_USERNAME`: Docker Hub 사용자명
   - `DOCKER_PASSWORD`: Docker Hub 액세스 토큰

### 워크플로우 파일

```yaml
# .github/workflows/docker-hub.yml
name: Docker Hub 배포

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 체크아웃
        uses: actions/checkout@v4

      - name: Docker Hub 로그인
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 메타데이터 추출
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKER_USERNAME }}/rescaper
          tags: |
            type=ref,event=tag
            type=raw,value=latest

      - name: 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### 태그 푸시로 자동 배포

```bash
# 버전 태그 생성
git tag v1.0.7

# 태그 푸시 (자동 배포 트리거)
git push origin v1.0.7
```

## 🏷️ 버전 관리 전략

### 권장 태그 전략

| 태그 | 용도 | 예시 |
|------|------|------|
| `latest` | 최신 안정 버전 | 항상 최신 릴리스 |
| `v1.0.7` | 특정 버전 | semantic versioning |
| `v1.0` | 메이저.마이너 | 호환성 유지 버전 |
| `dev` | 개발 중 | 최신 개발 빌드 |

### 예시 배포 플로우

```bash
# 1. 버전 태그 생성
git tag v1.0.8

# 2. 태그 푸시
git push origin v1.0.8

# 3. 스크립트로 배포
./scripts/deploy-dockerhub.sh v1.0.8

# 결과:
# - yourusername/rescaper:v1.0.8
# - yourusername/rescaper:latest (업데이트됨)
```

## 🔒 보안: 액세스 토큰 사용

비밀번호 대신 액세스 토큰을 사용하세요:

1. Docker Hub → Account Settings → Security
2. "New Access Token" 클릭
3. 토큰 이름 입력 (예: "RescapeR Deploy")
4. 권한: `read,write,delete`
5. 토큰 복사 후 저장

```bash
# 액세스 토큰으로 로그인
docker login -u yourusername
# Password: <액세스 토큰 입력>
```

## 🐛 문제 해결

### 로그인 오류
```bash
# 인증 정보 초기화
docker logout
docker login
```

### 푸시 권한 오류
- 저장소가 Public인지 확인
- Docker Hub에서 저장소 생성 확인
- 액세스 토큰 권한 확인

### 이미지 없음 오류
```bash
# 이미지 존재 확인
docker images | grep rescaper

# 없으면 재빌드
docker build -t rescaper:latest .
```

## 📎 유용한 명령어

```bash
# 이미지 히스토리 확인
docker history yourusername/rescaper:latest

# 이미지 크기 확인
docker images yourusername/rescaper --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 원격 이미지 정보
docker manifest inspect yourusername/rescaper:latest

# 로컬 정리
docker image prune -f  # 사용하지 않는 이미지 삭제
```

---

💡 **팁**: `latest` 태그는 항상 최신 버전을 가리키도록 유지하세요. 사용자들은 대부분 `docker pull yourusername/rescaper:latest`를 사용합니다.
