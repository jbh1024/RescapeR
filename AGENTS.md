# AGENTS.md - RescapeR 프로젝트 가이드

## 프로젝트 개요

RescapeR(리스케이퍼)는 로그라이크(Roguelike)와 메트로이드바니아(Metroidvania) 요소를 결합한 2D 횡스크롤 액션 게임 프로토타입입니다. "IT 회사 탈출"이라는 컨셉으로, 지하 6층 주차장부터 9층 대표이사실까지 진행됩니다.

- **프로젝트 유형**: 정적 웹 기반 브라우저 게임
- **주요 언어**: 한국어 (UI, 주석, 문서 전반)
- **라이선스**: 미표기 (프로토타입)

## 기술 스택

- **프론트엔드**: HTML5, CSS3, ES6+ JavaScript (vanilla JS)
- **렌더링**: HTML5 Canvas 2D Context
- **빌드 도구**: 없음 (정적 파일)
- **패키지 매니저**: 없음 (외부 의존성 없음)
- **테스트 프레임워크**: 없음
- **데이터 저장**: 브라우저 LocalStorage

## 파일 구조

```
/Users/jeongbyeonghun/Dev/git repo/RescapeR-kimi2/
├── index.html      # 게임 진입점, HUD 레이아웃
├── styles.css      # CSS 변수 기반 스타일링, 반응형 레이아웃
├── game.js         # 핵심 게임 로직 (~800줄, 싱글 파일 아키텍처)
├── README.md       # 사용자용 문서 (한국어)
└── AGENTS.md       # 본 파일 (AI 코딩 에이전트용)
```

## 아키텍처 개요

### 게임 엔진 구조

단일 파일(`game.js`)에 모든 게임 로직이 통합되어 있습니다:

1. **상수 및 설정** (라인 1-55): 캔버스 크기, 층 구성, 테마, 스킬 풀, 아이템 목록
2. **게임 상태** (라인 57-71): `state` 객체에 모든 런타임 상태 집중 관리
3. **유틸리티 함수**: 랜덤 시드, 로그, 저장/불러오기
4. **게임 오브젝트 생성**: 플레이어, 층 생성, 적 생성
5. **게임 로직**: 물리, 전투, 충돌, 업데이트 루프
6. **렌더링**: 배경, 월드, 캐릭터, 파티클, UI 그리기
7. **이벤트 핸들링**: 키보드 입력 처리

### 핵심 데이터 구조

```javascript
// 게임 상태 (state 객체)
{
  rngSeed,          // 절차적 생성용 시드
  floorIndex,       // 현재 층 인덱스
  floor,            // 현재 층 데이터 (플랫폼, 적, 아이템)
  cameraX,          // 칼라 X 좌표
  running,          // 게임 루프 실행 중 여부
  choosingSkill,    // 스킬 선택 중 여부
  player,           // 플레이어 객체
  particles,        // 파티클 배열
  meta              // 영구 아이템 (LocalStorage 저장)
}

// 플레이어 객체
{
  x, y, w, h,       // 위치 및 크기
  vx, vy,           // 속도
  hp, maxHp,        // 체력
  baseSpeed, speedMul,    // 이동속도
  baseDamage, damageMul,  // 공격력
  level, xp, needXp,      // 레벨/경험치
  skillNames,       // 획득한 스킬 목록
  // ... 애니메이션 및 타이머 상태
}
```

### 층 구성 (FLOOR_PLAN)

| 인덱스 | 층 | 이름 | 보스 |
|--------|-----|------|------|
| 0-4 | B6~B2 | 주차장 | 없음 |
| 5 | B1 | 구내식당 | 급식실 영양대장 |
| 6-11 | 1F~6F | 사무실/개발실 | 각 층 보스 |
| 12-14 | 7F~9F | 마케팅/기술지원/임원실 | 각 층 보스 |

## 실행 방법

별도의 빌드 과정 없이 정적 파일을 직접 실행합니다:

```bash
# 방법 1: 직접 파일 열기
open index.html

# 방법 2: 로컬 서버 실행 (권장 - CORS 이슈 방지)
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속

# 방법 3: Node.js
npx serve .
```

## 조작법

| 키 | 동작 |
|----|------|
| `A` / `D` 또는 `←` / `→` | 좌우 이동 |
| `W` / `↑` / `Space` | 점프 |
| `J` | 공격 |
| `K` | 대시 (무적 프레임) |
| `E` | 상호작용 (출구 이동) |
| `1` / `2` / `3` | 레벨업 시 스킬 선택 |
| `R` | 사망/클리어 후 재시작 |

## 코드 스타일 가이드라인

### 네이밍 규칙

- **함수명**: camelCase (`updatePlayer`, `spawnParticles`)
- **변수명**: camelCase (`floorIndex`, `skillOptions`)
- **상수**: UPPER_SNAKE_CASE (`FLOOR_PLAN`, `THEMES`)
- **전역 상태 객체**: `state` (단일 객체로 모든 상태 관리)

### 코드 패턴

1. **상태 집중화**: 모든 런타임 상태는 `state` 객체 하나에 저장
2. **함수형 업데이트**: `updateXxx()` 함수들이 상태 변경 담당
3. **Canvas 렌더링**: `drawXxx()` 함수들이 순수하게 그리기만 수행
4. **게임 루프**: `requestAnimationFrame` 기반, `dt`(델타타임) 사용

### 주석 스타일

한국어 주석을 사용하며, 섹션 구분은 명확히 합니다:

```javascript
// 섹션 제목
function doSomething() {
  // 단계 설명
  const result = compute();
  return result;
}
```

## 개발 시 주의사항

### 1. LocalStorage 사용

영구 아이템(`meta`)은 LocalStorage에 저장됩니다. 키는 `"rescaperMeta"`입니다:

```javascript
// 저장
localStorage.setItem("rescaperMeta", JSON.stringify(state.meta));

// 불러오기
const raw = localStorage.getItem("rescaperMeta");
```

**주의**: 저장 구조 변경 시 하위 호환성을 고려해야 합니다.

### 2. 캔버스 좌표계

- 캔버스 크기: 1100×620
- 월드 크기: 3200×620 (가로 스크롤)
- 지면 Y좌표: `GROUND_Y = HEIGHT - 75`
- 카메라: `state.cameraX` 값으로 좌표 변환

### 3. 충돌 검사

AABB 충돌 박스 사용:

```javascript
function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && 
         a.y < b.y + b.h && a.y + a.h > b.y;
}
```

### 4. 델타타임(dt)

`requestAnimationFrame` 콜백에서 `dt`(밀리초)를 받아 모든 물리 계산에 사용:

```javascript
function update(dt) {
  player.x += player.vx * dt * 0.001; // dt 기반 이동
}
```

### 5. 절차적 생성

선형합동법(LCG) 기반 시드 랜덤 사용. 같은 층/레벨 조합에서 항상 같은 맵 생성:

```javascript
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
```

## 확장 포인트

README에 명시된 확장 가능 영역:

- 아트/스프라이트 개선
- 사운드/음악 추가
- 세밀한 밸런싱
- 애니메이션 시스템
- 방/룸 기반 메트로이드식 탐험 구조
- 추가 스킬/아이템

## 보안 고려사항

- **클라이언트 사이드 저장**: LocalStorage 데이터는 사용자가 조작 가능
- **시드 랜덤**: 보안 목적이 아닌 재현성 목적의 PRNG 사용
- **입력 검증**: 키보드 입력은 신뢰할 수 있는 소스로 간주
