# [PRD] RescapeR Production Baseline

| 항목 | 값 |
|---|---|
| 문서 버전 | v5.2 (Architecture Refactored) |
| 기준일 | 2026-03-05 |
| 프로젝트명 | RescapeR |
| 장르 | 2D Roguelite Action Platformer |

## 1. 문서 역할
- 본 문서는 구현/배포 기준만 정의합니다.
- 세계관/층별 컨셉 상세는 `OVERVIEW.md`를 기준으로 확인합니다.

## 2. 저장소/병합 기준
- 실제 실행/배포 대상: `playable-web/*`
- Unity 영역은 스캐폴딩(`Assets/Scripts/*`)으로 유지
- `AGENTS.md` 규칙을 우선 준수

## 3. 게임 루프 기준
- 기본 흐름: `B6 시작 -> 층 진행 -> 9F 보스 -> 클리어`
- 클리어 후 선택:
1. 상태 초기화 후 B6 재시작
2. 현재 캐릭터 상태 유지 + B6 재도전(랭킹 갱신 루프)
- 랭킹 산정:
1. 총 클리어 횟수(내림차순)
2. 동률 시 클리어 시간(오름차순)

## 4. Web 제품 기준
- 아키텍처 및 모듈화:
  - **ES Modules (import/export)** 도입을 통한 의존성 관리 최적화
  - 모든 시스템 로직은 `playable-web/systems/` 내 독립 모듈로 캡슐화
  - 중앙 집중식 상태 관리(`state` 객체) 및 시스템별 주입 방식 사용
- 자산 관리:
  - `AssetManager` 모듈을 통한 비동기 자산 로딩 및 중앙 관리
- 저장/복구:
  - LocalStorage 자동 저장(`rescaperSave`)
  - 메타(`rescaperMeta`), 설정(`rescaperSettings`) 분리
- 핵심 전투:
  - 무기/어픽스, 랜덤 스킬 수치, 콤보/오버드라이브, 적 변이
  - 보스/임원 페이즈 분기(1~3), 페이즈별 스킬 쿨/압박 강화
- 층 콘텐츠:
  - B1 Safe Zone 상점
  - 층별 특수 이벤트 룸(E 상호작용)
- HUD/UI:
  - 정보 패널(`H`) 토글
  - 무기 고유 패시브 상태 HUD

## 5. 조작 표준 (현재 빌드)
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점/이벤트: `E`
- 소비 슬롯: `Q`
- 스킬 선택: `1 / 2 / 3`
- 재시작(사망): `R`
- 정보 패널 토글: `H`
- 이스터에그 층 이동: `+ / -`
- 볼륨: `Alt + + / Alt + -`
- 음소거: `M`
- 이펙트 간소화: `V`
- 일시정지: `P`

## 6. 품질/배포 기준
- 배포 루트: `playable-web`
- 최소 검증:
  - `node --check playable-web/game.js`
  - `./playable-web/smoke-check.sh`
- PWA 필수 자산:
  - `playable-web/manifest.webmanifest`
  - `playable-web/sw.js`
  - `playable-web/icon.svg`

## 7. 변경 규칙
- 신규 기능은 `playable-web` 우선 개발
- 저장 스키마 변경 시 하위 호환 고려
- 루트에 중복 실행 자산(`index.html`, `game.js`) 추가 금지
