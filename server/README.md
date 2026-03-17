# 🏆 RescapeR Ranking Server (Backend)

이 서버는 RescapeR 게임의 글로벌 랭킹인 **"명예의 퇴근 명부"**를 관리하기 위한 Node.js 기반 API 서버입니다.

## 🚀 빠른 시작 (Quick Start)

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하거나 기존 파일을 수정합니다. (기본값은 이미 설정되어 있습니다.)
*   `PORT`: 서버 포트 (기본: 3000)
*   `RANKING_SECRET_KEY`: 클라이언트와 통신 시 데이터 무결성 검증을 위한 HMAC 비밀키.

### 3. 서버 실행
```bash
node index.js
```

## 🛠️ 주요 API 엔드포인트

### **GET `/api/rankings`**
*   **설명**: 상위 10위 랭킹 리스트를 조회합니다.
*   **응답 예시**:
    ```json
    {
      "top10": [
        { "player_name": "야근러", "clear_time": 450.5, "total_overtime_pay": 1200, "created_at": "2024-03-16 12:00:00" },
        ...
      ]
    }
    ```

### **POST `/api/rankings`**
*   **설명**: 새로운 클리어 기록을 제출합니다.
*   **필수 본문(Body)**:
    - `player_name`: 사원명 (String)
    - `clear_time`: 총 소요 시간 (Float, 초 단위)
    - `total_overtime_pay`: 누적 야근수당 (Integer)
    - `checksum`: 데이터 무결성 검증을 위한 HMAC-SHA256 해시값.
*   **보안**: `clear_time`이 30초 미만인 기록은 서버에서 비정상적인 접근으로 간주하여 거부합니다.

## 💾 데이터베이스 관리
*   이 서버는 **SQLite**를 사용하며, 데이터는 `server/ranking.db` 파일에 저장됩니다.
*   Docker 사용 시 호스트의 파일과 볼륨 마운트하여 데이터를 영구 보존할 수 있습니다.

## 🐳 Docker 배포
서버 단독 빌드 시 아래 명령어를 사용합니다. (전체 배포는 루트의 `docker-compose` 권장)
```bash
docker build -t rescaper-ranking-api .
docker run -p 3000:3000 rescaper-ranking-api
```
