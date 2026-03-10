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
./scripts/build-multiarch.sh v1.1.0 yourusername

# 또는 단일 플랫폼 빌드
./scripts/deploy-dockerhub.sh v1.1.0 yourusername

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
- **아키텍처: ES Modules 기반 모듈화 시스템 (안전한 렌더링 루프 및 입력 보정 적용)**
- 진행 루프: `사원명 입력 -> B6 시작 -> 층 진행 -> 9F 보스 -> 클리어 -> 재도전 루프`
- 전투: 무기/어픽스, 실시간 데미지 텍스트 및 파티클, 확률적 아이템 드랍(야근수당/회복), 체력 재생 시스템
- 보스전: 페이즈 분기(1~3), 페이즈 전환 연출, 페이즈별 패턴 강화, 9F 전용 슬로건 배경 적용
- 시스템: 사원명 설정(기본 야근러), 야근수당(화폐) 체계, 단일 입력 보정(회복키트 1개씩 소모), 인벤토리 관리
- 층 콘텐츠: B1 보급소(상점 시각화 완료), 층별 특수 이벤트 룸(E 활성화), 이스터에그(0: 수당확보, +/-: 층이동)
- UI/HUD: 상세 스탯 대시보드(2열 3행), 동적 HP바, 무기/강화 실시간 리스트, 버프 가시화, 상세 일시정지 창

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
