# RescapeR (Merged Repository)

## 저장소 구조
- `AGENTS.md`: 에이전트 작업/개발 규칙
- `PRD.md`: 구현/배포 기준 문서
- `OVERVIEW.md`: 게임 컨셉/층 테마/시스템 개요
- `Assets/Scripts/*`: Unity/C# 스캐폴딩
- `playable-web/*`: 실제 실행/배포 대상 웹 게임

## 🐳 Docker 배포 (권장)

### 빠른 시작 (로컬)
```bash
# 이미지 빌드 및 실행
./scripts/deploy.sh dev

# 브라우저에서 접속
open http://localhost:8080
```

### 🚀 Docker Hub 배포

```bash
# 멀티 아키텍처 빌드 (권장 - AMD64/ARM64 모두 지원)
./scripts/build-multiarch.sh v1.0.7 yourusername

# 또는 단일 플랫폼 빌드
./scripts/deploy-dockerhub.sh v1.0.7 yourusername

# 배포 후 실행 (어떤 서버에서든 자동으로 맞는 아키텍처 선택)
docker run -p 8080:80 yourusername/rescaper:latest
```

**플랫폼 오류 발생 시?** → [DOCKER_PLATFORM.md](DOCKER_PLATFORM.md) 참고

자세한 내용은 [DEPLOY.md](DEPLOY.md), [DOCKERHUB.md](DOCKERHUB.md)를 참고하세요.

## 💻 로컬 웹 실행 (개발용)
프로젝트 루트에서:

```bash
python3 -m http.server 8000
# 브라우저: http://localhost:8000/playable-web/
```

## 검증
```bash
node --check playable-web/game.js
./playable-web/smoke-check.sh
```

## 현재 구현 요약
- 진행 루프: `B6 시작 -> 층 진행 -> 9F 보스 -> 클리어 선택 -> 재도전 루프`
- 전투: 무기/어픽스, 스킬 랜덤 수치, 콤보/오버드라이브, 적 변이
- 보스전: 페이즈 분기(1~3), 페이즈 전환 연출, 페이즈별 패턴 강화
- 시스템: 랭킹(총 클리어 횟수 우선 + 동률 시 클리어타임), 저장/복구, 적응형 보조
- 층 콘텐츠: B1 상점, 층별 특수 이벤트 룸(E 활성화), 이스터에그 층 이동(+/-)
- UI/HUD: 상태/조작/로그 토글(`H`), 무기 고유 패시브 HUD, 보스/목표/타임어택 표시

## 주요 조작
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점/이벤트: `E`
- 소비 슬롯: `Q`
- 스킬 선택: `1 / 2 / 3`
- 재시작(사망): `R`
- 정보 패널 토글(조작법/로그/상태): `H`
- 이스터에그 층 이동: `+ / -`
- 볼륨: `Alt + + / Alt + -`
- 음소거: `M`
- 이펙트 간소화: `V`
- 일시정지: `P`

## 문서 기준
- 제품 요구사항/운영 기준: `PRD.md`
- 게임 전반 컨셉/층 상세: `OVERVIEW.md`
- 웹 실행 상세: `playable-web/README.md`
