# RescapeR (Merged Repository)

**"퇴근을 위해 회사라는 던전을 탈출하라!"**

RescapeR는 직장 생활의 스트레스를 테마로 한 2D 로그라이트 액션 플랫폼어 게임입니다.  
지하 주차장(B6)에서 시작하여 대표이사실(9F)까지 올라가며 업무 스트레스 괴물들을 처치하고 무사히 퇴근하세요!

## 📂 저장소 구조
- `docs/PRD.md`: 제품 요구사항 및 기술 아키텍처 (Product Requirement Document)
- `docs/GDD.md`: 게임 디자인 상세, 층 구성, 무기, 스킬 데이터 (Game Design Document)
- `docs/DEPLOY.md`: Docker 및 멀티 아키텍처 배포 가이드
- `GEMINI.md`: AI 에이전트 가이드 및 컨텍스트
- `playable-web/`: 실제 실행 및 배포 대상 웹 게임 소스
- `Assets/Scripts/`: Unity/C# 스캐폴딩 (참조용)

## 🐳 Docker 빠른 시작 (권장)
```bash
# 로컬 개발용 이미지 빌드 및 실행
./scripts/deploy.sh dev

# 브라우저에서 접속: http://localhost:8080
```

## 💻 로컬 웹 실행 (개발용)
```bash
npm run serve
# 브라우저 접속: http://localhost:8000/playable-web/
```

## ✅ 검증 및 테스트
```bash
# 구문 체크
node --check playable-web/game.js

# 스모크 테스트
./playable-web/smoke-check.sh

# 자동화 테스트 (Playwright)
npx playwright test
```

## 🕹️ 핵심 조작
- 이동: `← / →`
- 점프: `↑`
- 공격: `Space`
- 대시: `Shift`
- 상호작용: `E`
- 회복: `Q`
- 전체 조작법 확인: 게임 중 `H` 키 입력

---
*상세 내용은 각 문서를 참고하십시오.*
