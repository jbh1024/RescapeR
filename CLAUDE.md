# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

RescapeR는 "퇴근을 위해 회사라는 던전을 탈출하라!" 테마의 2D 로그라이트 액션 플랫폼어 웹 게임. HTML5 Canvas + Vanilla JavaScript (ES6 Modules) 기반이며, 글로벌 랭킹용 Node.js 백엔드를 별도 운영한다.

## 빌드 및 실행

```bash
# 로컬 개발 서버 (python HTTP)
npm run serve              # http://localhost:8000/playable-web/

# Docker 개발 모드
npm run dev                # ./scripts/deploy.sh dev → http://localhost:8080

# 구문 체크
node --check playable-web/game.js

# 스모크 테스트
npm run smoke

# Playwright 자동화 테스트 (전체)
npm test                   # = npx playwright test

# 단일 테스트 파일 실행
npx playwright test tests/game.spec.js

# 프로덕션 JS 난독화
npm run obfuscate

# 랭킹 서버 로컬 실행
cd server && npm install && node index.js   # http://localhost:3000

# Docker Hub 배포 (게임 + 랭킹 서버, 멀티 아키텍처)
./scripts/build-multiarch.sh v1.2.0 yourusername

# 서버에서 실행 (Docker Hub에서 pull)
docker compose -f docker/docker-compose.yml pull && docker compose -f docker/docker-compose.yml up -d
```

## 아키텍처

### 하이브리드 구조
- **playable-web/**: 핵심 게임 클라이언트. `game.js`가 엔트리포인트이며 모든 시스템 모듈을 import
- **server/**: Express + SQLite 랭킹 API 서버. HMAC-SHA256으로 기록 무결성 검증
- **Assets/Scripts/**: Unity C# 스캐폴딩 (참조용, 현재 개발 대상 아님)

### 게임 클라이언트 시스템 모듈 (`playable-web/systems/`)
각 모듈은 `RescapeR[Name]` 패턴의 named export 클래스/객체를 제공하며 `game.js`에서 import하여 사용:

| 모듈 | 역할 |
|---|---|
| `data-config.js` | 모든 정적 데이터(층 구성, 몬스터풀, 스킬, 아트 경로 등)의 단일 진실 소스 |
| `render-system.js` | Canvas 2D 렌더링 (배경, 타일, 캐릭터, HUD) |
| `combat-system.js` | 전투 판정, 데미지 계산, 피격 처리 |
| `floor-system.js` | 층 생성, 전환, 플랫폼/몬스터 배치 |
| `player-system.js` | 플레이어 상태, 이동, 대시, 스킬 적용 |
| `ai-system.js` | 몬스터 AI 행동 패턴 |
| `ranking-system.js` | 랭킹 조회/등록, HMAC 체크섬, 오프라인 버퍼링 |
| `ui-system.js` | HTML DOM 오버레이 UI (스킬 선택, 상점, 정보 패널) |
| `input-system.js` | 키보드 입력 처리 |
| `fx-system.js` | 파티클, 데미지 텍스트, 화면 흔들림 |
| `audio-system.js` | 사운드/BGM 관리 |
| `save-system.js` | localStorage 기반 저장/로드 |

### 상태 관리
모든 런타임 데이터는 `game.js`의 `state` 객체에서 관리. 전역 변수 사용 금지. `window.gameState = state`로 테스트용 노출.

### 테스트 환경
Playwright 기반 E2E 테스트. `playwright.config.js`에서 python HTTP 서버를 자동 기동하여 `http://localhost:8000/playable-web/`을 대상으로 테스트.

## 개발 규칙

### 코드 수정 우선순위
- 신규 기능 및 버그 수정은 `playable-web/`에 먼저 적용
- 로직은 `playable-web/systems/` 내 적절한 모듈에 캡슐화
- 밸런스/수치 변경은 반드시 `data-config.js`의 상수를 수정

### 네이밍 컨벤션
- 시스템 모듈: `PascalCase` (예: `RenderSystem`, `RankingSystem`)
- export 패턴: `RescapeR[ModuleName]` (예: `RescapeRCombatSystem`)
- 게임 내 용어: 재화는 **'야근수당'**, 랭킹 보드는 **'명예의 퇴근 명부'**

### 랭킹 보안
- 모든 기록 제출은 HMAC-SHA256 체크섬 검증 필수
- 최소 클리어 타임 30초 미만은 서버에서 차단
- 오프라인 시 localStorage에 버퍼링 후 재접속 시 재전송

### 게임 시작 흐름
매 게임 시작(`startRun`) 시 `localStorage.clear()`를 통해 로컬 데이터 초기화

## 참조 문서
- `docs/PRD.md`: 제품 요구사항 및 기술 아키텍처
- `docs/GDD.md`: 게임 디자인 (층 구성, 무기, 스킬, 몬스터 데이터)
- `docs/RANKING_SYSTEM.md`: 랭킹 시스템 상세 요구사항
- `docs/DEPLOY.md`: Docker 및 멀티 아키텍처 배포 가이드
- `GEMINI.md`: AI 에이전트 가이드 (추가 컨텍스트)
