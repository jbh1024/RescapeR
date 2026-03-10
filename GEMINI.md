# GEMINI.md - RescapeR 프로젝트 컨텍스트 및 에이전트 가이드

## 프로젝트 개요
**RescapeR**는 "퇴근을 위해 회사라는 던전을 탈출하라!"를 하이 컨셉으로 한 2D 로그라이트 액션 플랫폼어 게임입니다. 플레이어는 지하 주차장(B6)에서 시작하여 대표이사실(9F)까지 올라가며 "업무 스트레스 괴물"들을 처치해야 합니다.

이 저장소는 다음과 같은 **하이브리드 구조**를 가집니다:
1.  **Playable Web (주력):** HTML5 Canvas와 Vanilla JavaScript(ES Modules)로 구현된 전체 게임입니다. 현재 개발 및 배포의 핵심 타겟입니다.
2.  **Unity Scaffold (참조):** 향후 Unity 이식이나 구조적 참조를 위한 C# 스크립트 및 데이터 모델입니다. (웹 빌드와 기능 동등 완성본이 아니며, 변경은 `Assets/Scripts` 하위로 제한)

### 핵심 기술 스택 및 아키텍처
-   **Frontend:** HTML5 Canvas 2D, Vanilla JavaScript (ES6 Modules), CSS3.
-   **아키텍처:**
    -   **Core 엔진 (`playable-web/game.js`):** 메인 게임 루프 및 전역 상태(`state`) 관리.
    -   **데이터 설정 (`playable-web/systems/data-config.js`):** 층 구성, 무기, 스탯 등 정적 데이터.
    -   **기능 시스템 (`playable-web/systems/*`):** 전투, 렌더링, 오디오, FX, UI 등 기능별 독립 모듈.
-   **PWA:** 오프라인 및 설치 지원을 위한 Service Worker (`sw.js`) 및 Web App Manifest.
-   **Storage:** `LocalStorage`를 이용한 저장 데이터(`rescaperSave`), 메타데이터(`rescaperMeta`), 설정(`rescaperSettings`) 관리.
-   **Deployment:** Docker (Nginx 기반), 멀티 아키텍처 빌드 지원 (AMD64, ARM64).

---

## 프로젝트 구조 및 기준 문서
-   `playable-web/`: **실제 프로덕션 소스 코드 (배포 기준).**
-   `Assets/Scripts/`: Unity/C# 스캐폴딩.
-   `scripts/`: Docker 빌드 및 배포 자동화 스크립트.
-   `docker/`: 웹 게임 서빙을 위한 Nginx 설정.
-   `PRD.md`: 구현 및 배포, 제품 상세 요구사항 기준 문서 (최상위 운영 기준).
-   `README.md`, `playable-web/README.md`: 실행 안내.

---

## 빌드 및 실행

### 로컬 개발 (Web)
Docker 없이 로컬에서 실행할 경우:
```bash
# 프로젝트 루트에서 실행
python3 -m http.server 8000
# 접속 주소: http://localhost:8000/playable-web/
```

### 로컬 개발 (Docker)
```bash
# 개발 모드로 빌드 및 실행
./scripts/deploy.sh dev
# 접속 주소: http://localhost:8080
```

### 검증 및 테스트
커밋 전 다음 명령어를 통해 기본 체크를 수행하십시오:
```bash
# 구문 체크
node --check playable-web/game.js

# 스모크 테스트 실행
./playable-web/smoke-check.sh
```

### 프로덕션 배포
```bash
# 멀티 아키텍처 빌드 (AMD64/ARM64)
./scripts/build-multiarch.sh <버전> <dockerhub_사용자명>
```

---

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

---

## 개발 규칙 (Conventions) & 에이전트 가이드

### 일반 원칙
-   **우선순위:** 신규 기능 및 버그 수정은 기본적으로 `playable-web/`에 먼저 적용되어야 합니다.
-   **운영 기준:** 모든 기능 요구사항, 디자인, 시스템 상세는 `PRD.md`를 최우선으로 참고합니다. 
-   **언어:** 문서는 한국어를 중심으로 작성하며, 코드 주석은 기존 스타일(영어 또는 한국어)을 따릅니다.
-   **루트 오염 방지:** 실행 자산(`index.html`, `game.js` 등)을 프로젝트 루트에 중복 추가하지 마십시오. 배포 루트는 항상 `playable-web/` 폴더 내에 위치해야 합니다.

### 코딩 표준 (Web)
-   **상태 관리:** 게임 런타임 데이터는 중앙 집중식 `state` 객체에서 관리합니다.
-   **모듈화:** 로직은 `playable-web/systems/` 내의 적절한 모듈에 캡슐화해야 합니다.
-   **렌더링 안전성:** 메인 루프에서 `state.floor` 존재 여부를 반드시 체크하여 초기화(사원명 입력 등) 단계에서의 참조 오류를 방지합니다.
-   **물리 계산:** 프레임레이트에 독립적인 동작을 위해 항상 델타 타임(`dt`)을 사용하여 이동 및 전투를 계산합니다.
-   **입력 처리:** 연속 입력(키 유지) 방지를 위해 `wasDown` 상태를 활용한 일회성 액션(회복키트 사용 등) 보장 로직을 준수합니다.
-   **용어 준수:** 게임 내 모든 재화 및 관련 메시지는 '야근수당' 명칭을 사용합니다.
-   **호환성:** 저장 시스템 수정 시 `LocalStorage` 스키마의 하위 호환성을 유지해야 합니다.

### AI 에이전트 상호작용 및 작업 주의사항
-   이 `GEMINI.md`에 정의된 규칙을 엄격히 준수하십시오.
-   변경 사항 제안 시 `PRD.md`에 명시된 로그라이트 루프 및 게임 아키텍처와 일치하는지 확인하십시오.
-   Unity 스캐폴딩 변경은 `Assets/Scripts` 하위로 제한하며, 웹 빌드와 기능 동등 완성본이 아님을 인지하십시오.