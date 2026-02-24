# [PRD] RescapeR Production Baseline

| 항목 | 값 |
|---|---|
| 문서 버전 | v5.0 |
| 기준일 | 2026-02-24 |
| 프로젝트명 | RescapeR |
| 장르 | 2D Roguelite Action Platformer |

## 1. 문서 역할
- 본 문서는 구현/배포 기준만 정의합니다.
- 게임의 전반적인 컨셉, 세계관, 층별 테마 상세는 `OVERVIEW.md`를 기준으로 확인합니다.

## 2. 저장소/병합 기준
- 게임 흐름 기준: `B6 시작 -> 층 진행 -> 9F 보스 -> 10F 결과 -> 루프`.
- 디렉토리 구조 기준: `Rescape-codex` 구조 준수.
- 실제 실행/배포 대상: `playable-web/*`.
- `AGENTS.md`는 유지합니다.

## 3. 디렉토리 규약
```
RescapeR-kimi2/
├── AGENTS.md
├── OVERVIEW.md
├── PRD.md
├── README.md
├── Assets/Scripts/*        # Unity/C# 스캐폴딩
└── playable-web/*          # 실제 실행/배포 대상 웹 빌드
```

## 4. Web 제품 기준
- 시작/종료:
  - 시작 층: B6
  - 종료: 9F 클리어 후 10F 결과 화면
  - 결과 후 B6 재시작
- 저장:
  - 층 전환 시 자동 저장(LocalStorage JSON)
- 핵심 시스템:
  - 무기/어픽스
  - B1 Safe Zone 상점
  - 레벨업 스킬 선택
  - 보스/임원 패턴 및 텔레그래프
  - 전투 스타일 시스템
  - 콤보/기록/적응형 보조

## 5. 조작 표준 (현재 빌드)
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점: `E`
- 소비 슬롯: `Q`
- 스타일 변경(B1): `C`
- 볼륨: `- / =`
- 음소거: `M`
- 이펙트 간소화: `V`
- 일시정지: `P`
- 재시작: `R`

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
- 신규 기능은 기본적으로 `playable-web` 기준으로 개발합니다.
- Unity 스캐폴딩 변경은 `Assets/Scripts` 하위로 제한합니다.
- 루트에 중복 실행 자산(`index.html`, `game.js`)을 생성하지 않습니다.
