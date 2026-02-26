# AGENTS.md - RescapeR 프로젝트 가이드

## 프로젝트 개요

RescapeR는 "IT 회사 탈출" 컨셉의 2D 로그라이트 액션 프로젝트입니다.
현재 저장소는 웹 플레이어블 구현과 Unity 스캐폴딩이 공존합니다.

- 프로젝트 유형: 하이브리드 저장소 (Web Playable + Unity Scaffold)
- 배포 기준: `playable-web`
- 문서 언어: 한국어 중심

## 저장소 구조 (현재 기준)

```
/Users/byeonghunjeong/GIT/RescapeR/
├── AGENTS.md
├── README.md
├── PRD.md
├── OVERVIEW.md
├── playable-web/                 # 실제 실행/배포 대상
│   ├── index.html
│   ├── styles.css
│   ├── game.js
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── systems/
│   └── smoke-check.sh
└── Assets/Scripts/               # Unity/C# 스캐폴딩
```

## 기준 문서

- 제품/배포 기준: `PRD.md`
- 컨셉/시스템 개요: `OVERVIEW.md`
- 실행 안내: `README.md`, `playable-web/README.md`

## 실행 및 검증

### 웹 실행

```bash
python3 -m http.server 8000
# 브라우저: http://localhost:8000/playable-web/
```

### 최소 검증

```bash
node --check playable-web/game.js
./playable-web/smoke-check.sh
```

## 아키텍처 가이드

### 1) playable-web (실구현)

- 런타임 핵심: `playable-web/game.js`
- 분리 시스템: `playable-web/systems/*`
- 저장: LocalStorage
: `rescaperMeta`, `rescaperSave`, `rescaperSettings`

핵심 구현 상태:
- 보스/임원 페이즈 분기 강화(1~3)
- 무기 고유 패시브 HUD
- 층별 특수 이벤트 룸
- 랭킹(클리어 횟수 + 클리어타임)

개발 원칙:
- 상태는 `state` 객체 중심으로 관리
- 물리/전투 계산은 `dt` 기반으로 유지
- 저장 스키마 변경 시 하위 호환 고려

### 2) Assets/Scripts (Unity 스캐폴딩)

- 목적: 구조/데이터 모델 스캐폴딩
- 주의: 웹 빌드와 기능 동등 완성본이 아님
- Unity 변경은 `Assets/Scripts` 하위로 제한

## 조작 표준 (현재 웹 빌드)

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

## 작업 시 주의사항

- 신규 기능은 기본적으로 `playable-web`에서 개발
- 루트에 중복 실행 자산(`index.html`, `game.js`) 추가 금지
- 배포 루트는 항상 `playable-web`로 간주
- 문서와 코드 불일치 시 `PRD.md`를 운영 기준으로 우선 정렬
