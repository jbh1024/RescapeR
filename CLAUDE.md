# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

RescapeR는 "퇴근을 위해 회사라는 던전을 탈출하라!" 테마의 2D 로그라이트 액션 플랫폼어 웹 게임. HTML5 Canvas + Vanilla JavaScript (ES6 Modules) 기반이며, 글로벌 랭킹용 Node.js 백엔드를 별도 운영한다.

## 빌드 및 실행

```bash
# 로컬 개발 서버 (serve)
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

# Docker 로컬 빌드 (개발용)
docker compose -f docker/docker-compose.yml up --build   # http://localhost:8080

# Docker Hub 배포 (게임 + 랭킹 서버, 멀티 아키텍처)
./scripts/build-multiarch.sh v1.2.1 yourusername

# 프로덕션 실행 (Docker Hub에서 pull, 버전 지정 가능)
RESCAPER_TAG=v1.2.1 docker compose -f docker/docker-compose.prod.yml up -d
# 또는 latest 사용
docker compose -f docker/docker-compose.prod.yml pull && docker compose -f docker/docker-compose.prod.yml up -d
```

## 아키텍처

### 하이브리드 구조
- **playable-web/**: 핵심 게임 클라이언트. `game.js`가 엔트리포인트이며 모든 시스템 모듈을 import
- **server/**: Express + MySQL 랭킹 API 서버. 서버 전용 HMAC-SHA256으로 기록 무결성 서명
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
| `ranking-system.js` | 랭킹 조회/등록, 오프라인 버퍼링 (체크섬은 서버 전용) |
| `ui-system.js` | HTML DOM 오버레이 UI (스킬 선택, 상점, 정보 패널), XSS 방어 유틸리티 |
| `input-system.js` | 키보드 입력 처리 |
| `fx-system.js` | 파티클, 데미지 텍스트, 화면 흔들림 |
| `audio-system.js` | 사운드/BGM 관리 |
| `save-system.js` | localStorage 기반 저장/로드, 메타데이터 무결성 검증 |

### 상태 관리
모든 런타임 데이터는 `game.js`의 `state` 객체에서 관리. 전역 변수 사용 금지. `window.gameState`는 `?__test__` URL 파라미터가 있을 때만 노출 (테스트 전용).

### 테스트 환경
Playwright 기반 E2E 테스트. `playwright.config.js`에서 `http-server` 정적 서버를 자동 기동하여 `http://127.0.0.1:8000/playable-web/`을 대상으로 테스트.

### CI/CD (Jenkins)
Jenkins 프리스타일 job 3개로 파이프라인 운영:
- `rescaper-ci`: 의존성 설치 → 구문 체크 → Playwright E2E 테스트
- `rescaper-deploy-prod`: 멀티 아키텍처 Docker 빌드 → Docker Hub Push (VERSION 파라미터)
- `rescaper-deploy-server`: Docker Hub Pull → 프로덕션 배포 (VERSION 파라미터)

`docker-compose.prod.yml`은 `RESCAPER_TAG` 환경변수로 이미지 버전 제어 (기본값: `latest`).

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
- HMAC-SHA256 체크섬은 **서버에서만** 생성/관리 (클라이언트에 시크릿 키 없음)
- `RANKING_SECRET_KEY` 환경변수 필수 (미설정 시 서버 시작 거부)
- 최소 클리어 타임 30초 미만은 서버에서 차단
- 서버에서 player_name HTML 태그 차단 + 길이 제한(1~10자) 검증
- 오프라인 시 localStorage에 버퍼링 후 재접속 시 재전송

### 보안 정책
- **CSP**: `script-src 'self'` — 인라인 스크립트/외부 스크립트 차단 (index.html + nginx)
- **XSS 방어**: `escapeHtml()` (ui-system.js) — 서버 데이터를 innerHTML에 삽입 시 필수 사용
- **인라인 핸들러 금지**: `onclick` 등 사용 금지 → `addEventListener` 사용
- **환경변수**: `.env` 파일은 Git에 커밋하지 않음 (`.env.example`만 커밋)
- **서버 입력 검증**: clear_time(30~86400), total_overtime_pay(0~999999) 타입/범위 강제
- **Rate Limiting**: POST 5회/분, GET 30회/분 (express-rate-limit)
- **CORS**: 화이트리스트 방식 (`CORS_ORIGINS` 환경변수), 기본값 localhost만 허용
- **전역 state 보호**: `window.gameState`는 `?__test__` 파라미터 시에만 노출
- **localStorage 무결성**: `save-system.js`의 `_validateMeta()`로 타입/범위 검증 후 로드

### 게임 흐름 (시네마틱)
- **오프닝**: 사원명 입력 후 게임 시작 시, `OPENING_LINES` 중 랜덤 1개가 타이핑 효과로 표시 → 페이드아웃 후 게임 시작
- **엔딩**: 9층 보스 클리어 후 `ENDING_LINES` 중 랜덤 1개가 타이핑 효과로 표시 → 페이드아웃 후 퇴근 성공 화면(기록 저장/초기화면)
- 시네마틱 공통 함수: `showCinematic(lines, onComplete)` → `showOpening` / `showEnding` 래퍼
- 매 게임 시작(`startRun`) 시 `localStorage.clear()`를 통해 로컬 데이터 초기화

### 테스트 필수
- 모든 기능 수정 및 개발은 테스트를 모두 pass 하고 검증이 완료가 되어야 작업이 완료 된 것으로 간주한다.

### 문서 최신화
- 사용자의 요청이나 버그의 수정으로 게임관련 사항(게임 디자인, 아키텍처, 보안사항)이 변경 된 경우. 관련 문서를 항상 최신화 하는 작업을 한다.

## 참조 문서
- `docs/PRD.md`: 제품 요구사항 및 기술 아키텍처
- `docs/GDD.md`: 게임 디자인 (층 구성, 무기, 스킬, 몬스터 데이터)
- `docs/RANKING_SYSTEM.md`: 랭킹 시스템 상세 요구사항
- `docs/DEPLOY.md`: Docker 및 멀티 아키텍처 배포 가이드
- `docs/SECURITY_REMEDIATION_PLAN.md`: 보안 취약점 수정 계획서
- `GEMINI.md`: AI 에이전트 가이드 (추가 컨텍스트)
