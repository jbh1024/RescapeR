# GEMINI.md - RescapeR AI Agent Context & Guide

## 🚀 프로젝트 개요
**RescapeR**는 "퇴근을 위해 회사라는 던전을 탈출하라!"를 테마로 한 2D 로그라이트 액션 플랫폼어 게임입니다.  
본 가이드는 AI 에이전트가 코드 수정, 기능 추가, 리팩토링 시 준수해야 할 핵심 지침을 담고 있습니다.

## 🏗️ 하이브리드 아키텍처 이해
1.  **Playable Web (주력):** HTML5 Canvas + Vanilla JavaScript (ES6 Modules). **현재 개발 및 배포의 핵심 타겟입니다.**
2.  **Unity Scaffold (참조):** 향후 Unity 이식이나 구조적 참조를 위한 C# 스크립트. **직접적인 웹 게임 기능에 영향을 주지 않으며 변경은 신중해야 합니다.**

## 📘 핵심 참조 문서
- **기능 요구사항 & 아키텍처:** `docs/PRD.md` (Product Requirement Document)
- **게임 디자인 & 상세 데이터:** `docs/GDD.md` (Game Design Document)
- **정적 데이터 상수:** `playable-web/systems/data-config.js`

## 🛠️ 에이전트 개발 규칙 (Conventions)

### 1. 코드 수정 및 밸런스 원칙
- **우선순위:** 신규 기능 및 버그 수정은 기본적으로 `playable-web/`에 먼저 적용합니다.
- **모듈화:** 로직은 `playable-web/systems/` 내의 적절한 모듈에 캡슐화합니다.
- **상태 관리:** 모든 런타임 데이터는 `state` 객체에서 관리합니다. 전역 변수 사용을 지양하세요.
- **재시작 로직:** 매 게임 시작(`startRun`) 시 `localStorage.clear()`를 통해 로컬 데이터를 초기화하여 매 판 순수한 기본 상태에서 시작합니다.
- **스킬 상한제 (Balance Cap):** 무한 성장을 방지하기 위해 특정 스킬에 상한선을 적용합니다.
  - **회복호흡:** 최대 2중첩, 초당 재생 수치 최대 2
  - **강철몸:** 받는 피해 감소율 최대 -50% (0.5배)
  - **정밀사격:** 치명타 확률 최대 30%

### 2. 스타일 및 네이밍
- **언어:** UI와 문서는 한국어 위주, 코드와 주석은 기존 스타일(주로 영어)을 따릅니다.
- **변수/함수:** `camelCase` 사용.
- **시스템 모듈:** `PascalCase` 사용 (예: `RenderSystem`, `CombatSystem`).
- **용어 준수:** 모든 재화 및 관련 메시지는 **'야근수당'** 명칭을 고수합니다.

### 3. 검증 및 보안 프로세스 (필수)
- **JS 난독화:** 프로덕션 빌드 시 `javascript-obfuscator`를 적용하여 보안을 강화합니다 (`Dockerfile` 멀티스테이지 빌드 활용).
- **구문 체크:** `node --check playable-web/game.js`
- **스모크 테스트:** `./playable-web/smoke-check.sh`
- **자동화 테스트:** `npx playwright test` (신규 기능 검증용 `feature_update.spec.js` 포함)

## 🕹️ 조작 표준 (Key Bindings)
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점/이벤트: `E`
- 소비 슬롯: `Q`
- 스킬 선택: `1 / 2 / 3`
- 재시작(사망): `R`
- 정보 패널 토글: `H`
- 볼륨: `Alt + + / Alt + -`
- 음소거: `M`
- 이펙트 간소화: `V`
- 일시정지: `P`
- **이스터에그 (치트)**:
  - 다음 층 이동: `Ctrl + ]`
  - 이전 층 이동: `Ctrl + [`
  - 야근수당 +100: `Ctrl + 0`
