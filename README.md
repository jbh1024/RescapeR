# RescapeR (Merged Repository)

병합 기준:
- 게임 흐름: 기존 `RescapeR-kimi2` 구현 유지
- 디렉토리 구조: `Rescape-codex` 구조 준수

## 저장소 구조
- `AGENTS.md`: Kimi AI 에이전트 지시 문서 (유지 대상)
- `PRD.md`: 병합 기준 제품 요구사항 문서
- `Assets/Scripts/*`: Unity/C# 스캐폴딩
- `playable-web/*`: 실제 실행/배포 대상 웹 게임

## 웹 실행
프로젝트 루트에서:

```bash
python3 -m http.server 8000
# 브라우저: http://localhost:8000/playable-web/
```

## 검증
```bash
./playable-web/smoke-check.sh
node --check playable-web/game.js
```

## 배포
- 정적 호스팅 배포 루트: `playable-web`
- 필수 파일:
  - `playable-web/index.html`
  - `playable-web/styles.css`
  - `playable-web/game.js`
  - `playable-web/manifest.webmanifest`
  - `playable-web/sw.js`
  - `playable-web/icon.svg`

## 구현 요약
- B6 시작 -> 층 진행 -> 9F 보스 -> 10F 결과 -> 루프
- 무기/어픽스, B1 상점, 스킬 선택, 보스 텔레그래프
- 전투 스타일, 콤보, 기록 시스템, 적응형 보조

## 현재 조작
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점: `E`
- 소비 슬롯: `Q`

## 문서 기준
- 제품 요구사항/운영 기준: `PRD.md`
- 게임 전반 컨셉/층별 상세: `OVERVIEW.md`
- 웹 실행 상세: `playable-web/README.md`
