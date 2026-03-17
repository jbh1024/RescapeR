FROM node:18-alpine

# 네이티브 모듈 빌드를 위한 도구 설치 (sqlite3용)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# package.json만 먼저 복사하여 레이어 캐싱 활용
COPY package*.json ./
RUN npm install

# 나머지 소스 복사 (.dockerignore에 의해 node_modules는 제외됨)
COPY . .

# SQLite DB 파일 권한 설정
RUN touch ranking.db && chmod 666 ranking.db

EXPOSE 3000

CMD ["node", "index.js"]
