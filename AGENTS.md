# AGENTS.md - RescapeR 프로젝트 가이드

## 프로젝트 개요

RescapeR(리스케이퍼)는 "IT 회사 탈출" 컨셉의 2D 로그라이트 액션 프로젝트입니다.
현재 저장소는 **웹 플레이어블 구현**과 **Unity 스캐폴딩**을 함께 포함하는 병합 구조입니다.

- 프로젝트 유형: 하이브리드 저장소 (Web Playable + Unity Scaffold)
- 주요 언어: 한국어 (UI/주석/문서)
- 배포 기준: `playable-web` 정적 웹 빌드

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
│   ├── icon.svg
│   └── smoke-check.sh
└── Assets/Scripts/               # Unity/C# 스캐폴딩
    ├── Core/
    ├── Data/
    ├── Gameplay/
    ├── UI/
    └── Editor/
```

## 기준 문서

- 제품/배포 기준: `PRD.md`
- 컨셉/층 테마 상세: `OVERVIEW.md`
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
- 렌더링: Canvas 2D
- 저장: LocalStorage (`rescaperMeta`, `rescaperSave`, `rescaperSettings`)
- 게임 흐름: B6 시작 -> 층 진행 -> 9F 보스 -> 결과 -> B6 루프

개발 원칙:
- 상태는 `state` 객체 중심으로 일관 관리
- 물리/전투 계산은 `dt` 기반
- 렌더 함수는 가능하면 그리기 책임에 집중
- 신규 기능은 기본적으로 `playable-web`에 우선 반영

### 2) Assets/Scripts (Unity 스캐폴딩)

- 목적: 데이터 모델/이벤트 흐름/에디터 부트스트랩의 기반 제공
- 구현 범위: PRD 반영용 구조와 샘플 로직
- 주의: 웹 빌드와 동등 기능 완성본이 아님

개발 원칙:
- 데이터 정의는 `Data/*` 중심
- 런타임 흐름은 `Core/*`, `Gameplay/*`, `UI/*`에서 분리
- Unity 변경은 `Assets/Scripts` 하위로 제한

## 조작 표준 (현재 웹 빌드)

- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점: `E`
- 소비 슬롯: `Q`
- 전투 스타일 변경(B1): `C`
- 볼륨: `- / =`
- 음소거: `M`
- 이펙트 간소화: `V`
- 일시정지: `P`
- 재시작: `R`

## 작업 시 주의사항

- 루트에 중복 실행 자산(`index.html`, `game.js`)을 새로 만들지 않습니다.
- 배포 루트는 항상 `playable-web`로 간주합니다.
- 저장 데이터 스키마 변경 시 하위 호환을 고려합니다.
- 문서와 코드가 불일치하면 `PRD.md`/`README.md` 기준으로 정렬합니다.
