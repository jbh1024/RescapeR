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
./smoke-check.sh
```

## 조작
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용/상점: `E`
- 소비 슬롯: `Q`

## 포함 파일
- `index.html`
- `styles.css`
- `game.js`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
