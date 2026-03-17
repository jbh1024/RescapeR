---
name: project requirement document
description: 제품 요구사항 및 기술 아키텍처 (Product Requirement Document)
---
# [PRD] RescapeR Product Requirement Document

| 항목 | 값 |
|---|---|
| 문서 버전 | v7.0 (Ranking Integration) |
| 기준일 | 2026-03-16 |
| 프로젝트명 | RescapeR |
| 목표 플랫폼 | Web (PWA), Desktop (Docker) |

## 1. 프로젝트 비전
- **하이 컨셉:** "퇴근을 위해 회사라는 던전을 탈출하라!"
- **핵심 가치:** 직장 생활의 스트레스를 로그라이트 액션으로 해소하고, "명예의 퇴근 명부"를 통한 글로벌 경쟁 경험 제공.

## 2. 기술 아키텍처
- **Frontend:** Pure JavaScript (ES6+) & HTML5 Canvas 2D.
- **Backend:** Node.js (Express) + SQLite 기반 랭킹 API 서버.
- **Communication:** REST API (JSON), HMAC-SHA256 데이터 무결성 보장.
... (중략) ...
## 3. 주요 기능 요구사항
- **로그라이트 진행:** 사망 시 B6부터 재시작. 층별 무작위 요소(몬스터 어픽스, 스킬 드랍).
- **성장 시스템:** 층 클리어 시 스킬 선택(3택 1), 상점(B1 보급소)을 통한 장비 및 아티팩트 구매.
- **글로벌 랭킹 (신규):** 클리어 타임 및 야근수당 기반 글로벌 경쟁 시스템. K키 토글 및 클리어 시 등록 팝업 제공.
- **전투 시스템:** 근접/원거리 공격, 대시, 실시간 피드백(데미지 텍스트, 화면 흔들림, 파티클).
- **보스전:** 9F 최종 보스(CEO)를 포함한 층별 미니보스/섹션 보스. 페이즈 전환 시스템(1~3페이즈).
- **편의 기능:** 자동 저장, 일시정지, 조작 가이드 패널(H), 이펙트 최적화(V).

## 4. UI/UX 가이드라인
- **HUD:** 실시간 스탯 대시보드 (ATK, SPD, ASPD, DEF, CRIT, CRIT_DMG).
- **피드백:** HP 잔량에 따른 바 색상 변경 (녹/황/적). 캐릭터 상태 카드 표시.
- **테마:** 층별 고유 컬러셋 및 배경 이미지 적용 (data-config.js 정의 준수).

## 5. 품질 및 검증 기준
- **성능:** 60FPS 타겟, 저사양 기기를 위한 이펙트 간소화 모드 지원.
- **안정성:** `state.floor` 존재 여부 체크를 통한 렌더링 오류 방지.
- **테스트:** 
  - 정적 분석: `node --check playable-web/game.js`
  - 자동화 테스트: Playwright (`tests/*.spec.js`)
  - 스모크 테스트: `./playable-web/smoke-check.sh`

## 6. 배포 및 운영
- **Docker:** Nginx 기반 경량 이미지 (alpine).
- **CI/CD:** GitHub Actions를 통한 멀티 아키텍처 빌드 (AMD64, ARM64).
- **버전 관리:** Semantic Versioning 적용.
