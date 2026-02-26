# RescapeR Web Build

`playable-web`는 실제 배포/실행 대상 웹 빌드 디렉토리입니다.

## 실행
프로젝트 루트에서:

```bash
python3 -m http.server 8000
# http://localhost:8000/playable-web/
```

## 점검
프로젝트 루트에서:

```bash
node --check playable-web/game.js
./playable-web/smoke-check.sh
```

## 조작
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

## 구현 하이라이트
- 보스/임원 페이즈 분기 강화(1~3)
- 무기 고유 패시브 상태 HUD
- 층별 특수 이벤트 룸(E 상호작용)
- 랭킹(클리어 횟수 + 클리어타임)

## 포함 파일
- `index.html`
- `styles.css`
- `game.js`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
