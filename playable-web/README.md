# RescapeR Web App

`playable-web` 디렉토리는 RescapeR 게임의 실제 프로덕션 소스 코드를 포함하고 있습니다.

## 🚀 빠른 실행
프로젝트 루트에서 다음 명령어를 실행하십시오:
```bash
python3 -m http.server 8000
# 접속 주소: http://localhost:8000/playable-web/
```

## 🛠️ 개발 및 점검
- **구문 체크:** `node --check game.js`
- **스모크 테스트:** `./smoke-check.sh`
- **전체 가이드:** 프로젝트 루트의 `README.md`를 참고하십시오.

## 📁 주요 구성 요소
- `game.js`: 메인 게임 엔진 및 루프
- `systems/`: 기능별 모듈 (Combat, Render, AI 등)
- `index.html`: 게임 캔버스 및 레이아웃
- `styles.css`: 게임 UI 스타일링
- `sw.js`: PWA 서비스 워커
