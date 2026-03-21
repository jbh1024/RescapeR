# RescapeR 보안 취약점 수정 보고서

> **작성일**: 2026-03-20
> **분석 대상**: playable-web/, server/, docker/
> **총 식별**: 13건 (CRITICAL 1, HIGH 2, MEDIUM 8, LOW 5)
> **완료**: 8건 | **보류**: 2건 | **미착수(LOW)**: 5건

---

## 전체 현황 요약

| Phase | 심각도 | 대상 | 상태 | 커밋 |
|-------|--------|------|------|------|
| **Phase 1** | CRITICAL / HIGH | 3건 | **완료** | `dba7d75` |
| **Phase 2** | MEDIUM | 5건 (2건 제외) | **완료** | `ec3502d` |
| **Phase 3** | LOW | 5건 | **완료** |

---

## Phase 1 완료 — CRITICAL / HIGH (커밋: `dba7d75`)

### 1-1. CRITICAL: HMAC 시크릿 키 클라이언트 노출 제거

**문제**: 클라이언트와 서버가 동일한 하드코딩 시크릿 키(`rescaper_secret_token_2024`)를 공유. DevTools에서 키를 확인하고 위조 기록 제출 가능.

**수정 내용**:
- 클라이언트에서 `SECRET_KEY`, `generateChecksum()` 완전 제거
- 서버 전용 HMAC-SHA256 체크섬 생성 구조로 전환
- `RANKING_SECRET_KEY` 환경변수 필수화 (미설정 시 서버 시작 거부)
- `server/.env` Git 추적 제거, `.env.example`만 커밋
- `.gitignore`에 `**/.env`, `**/.env.local` 패턴 추가

**변경 파일**: `ranking-system.js`, `server/index.js`, `server/.env`, `.gitignore`

### 1-2. HIGH: XSS (Cross-Site Scripting) 방어

**문제**: 서버에서 받은 `player_name`을 HTML 이스케이프 없이 `innerHTML`로 삽입. 랭킹보드 조회 시 Stored XSS 공격 가능.

**수정 내용**:
- `escapeHtml()` 유틸리티 추가 및 export (`ui-system.js`)
- 랭킹보드 `player_name`, 게임 로그에 이스케이프 적용
- 서버에서 `player_name` HTML 태그 차단 + 길이 제한(1~10자) 검증

**변경 파일**: `ui-system.js`, `game.js`, `server/index.js`

### 1-3. HIGH: Content Security Policy (CSP) 부재 해소

**문제**: CSP 헤더 없이 인라인 스크립트, 외부 JS, 클릭재킹 모두 허용 상태.

**수정 내용**:
- `index.html`에 CSP 메타 태그 추가 (`script-src 'self'` 등)
- `docker/nginx.conf`에 CSP, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy` 헤더 추가
- `onclick` 인라인 핸들러 → `addEventListener` 전환 (사망 화면, 스킬 선택)
- `window.gameState.pickSkill` 전역 노출 제거

**변경 파일**: `index.html`, `game.js`, `docker/nginx.conf`

---

## Phase 2 완료 — MEDIUM (커밋: `ec3502d`)

### 2-1. 서버 입력 검증 강화

**수정**: `clear_time` (`parseFloat`, 30~86400), `total_overtime_pay` (`parseInt`, 0~999999) 타입 강제 + 범위 검증. 검증 후 파싱된 값으로 체크섬 생성 및 DB 저장.

**변경 파일**: `server/index.js`

### 2-3. Rate Limiting 추가

**수정**: `express-rate-limit` 패키지 도입. POST 5회/분, GET 30회/분 제한.

**변경 파일**: `server/index.js`, `server/package.json`

### 2-4. 전역 state 노출 제한

**수정**: `window.gameState`를 `?__test__` URL 파라미터가 있을 때만 노출. 모든 테스트 파일의 goto URL에 `?__test__` 파라미터 추가.

**변경 파일**: `game.js`, `tests/*.spec.js` (5개 파일)

### 2-5. CORS 화이트리스트 설정

**수정**: `cors()` 전체 허용 → `CORS_ORIGINS` 환경변수 기반 화이트리스트. 기본값 `localhost:8000`, `localhost:8080`만 허용.

**변경 파일**: `server/index.js`

### 2-6. localStorage 무결성 검증

**수정**: `save-system.js`에 `_validateMeta()` 메서드 추가. 숫자 필드 타입/범위 검증, `items` 객체 검증, 배열 필드 검증, `ranking` 객체 검증. 범위 초과 시 기본값으로 리셋.

**변경 파일**: `save-system.js`

### Phase 2 제외 항목

| 항목 | 사유 |
|------|------|
| **2-2 DB 기본 비밀번호** | 운영 환경 설정 이슈. 프로덕션 배포 시 `DB_PASSWORD` 환경변수로 관리 |
| **2-8 개발 치트(이스터에그)** | 게임 기능으로 유지. 프로덕션 비활성화 별도 판단 필요 |

---

## Phase 3 완료 — LOW

| 순서 | 취약점 | 요약 | 관련 파일 | 상태 |
|------|--------|------|-----------|------|
| 3-1 | Express 글로벌 에러 핸들링 | `app.use((err,req,res,next)=>...)` 미들웨어 + `process.on('unhandledRejection')` 추가 | `server/index.js` | **완료** |
| 3-2 | Nginx 보안 헤더 보강 | `Strict-Transport-Security`, `Permissions-Policy` 헤더 추가 | `docker/nginx.conf` | **완료** |
| 3-3 | 프로덕션 console 로깅 정리 | `console.error`에 `error.message`만 출력하도록 수정 | `ranking-system.js` | **완료** |
| 3-4 | 서버 에러 로깅 개선 | `logError()` 헬퍼 — 개발: 스택 트레이스, 프로덕션: 메시지만 | `server/index.js` | **완료** |
| 3-5 | Nginx 서버 버전 노출 차단 | `server_tokens off;` 추가 | `docker/nginx.conf` | **완료** |

---

## 적용된 보안 정책 요약

### 클라이언트 (playable-web/)
- **CSP**: `script-src 'self'` — 인라인 스크립트/외부 스크립트 차단 (index.html + nginx)
- **XSS 방어**: `escapeHtml()` — 서버 데이터를 innerHTML에 삽입 시 필수 사용
- **인라인 핸들러 금지**: `onclick` 등 사용 금지 → `addEventListener` 사용
- **전역 state 보호**: `window.gameState`는 `?__test__` 파라미터 시에만 노출
- **localStorage 무결성**: `_validateMeta()`로 타입/범위 검증 후 로드

### 서버 (server/)
- **HMAC 서버 전용**: 체크섬은 서버에서만 생성/관리 (클라이언트에 시크릿 키 없음)
- **환경변수 필수**: `RANKING_SECRET_KEY` 미설정 시 서버 시작 거부
- **입력 검증**: player_name (문자열, 1~10자, HTML 차단), clear_time (30~86400), total_overtime_pay (0~999999)
- **Rate Limiting**: POST 5회/분, GET 30회/분
- **CORS 화이트리스트**: `CORS_ORIGINS` 환경변수, 기본값 localhost만 허용

### 인프라 (docker/)
- **Nginx 보안 헤더**: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- **환경변수 관리**: `.env` 파일 Git 미커밋, `.env.example`만 커밋
- **필수 변수 강제**: `docker-compose.prod.yml`에서 `RANKING_SECRET_KEY` 미설정 시 컨테이너 시작 거부
