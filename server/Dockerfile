FROM node:18-alpine

WORKDIR /app

# package.json만 먼저 복사하여 레이어 캐싱 활용
COPY package*.json ./
RUN npm install --omit=dev

# 나머지 소스 복사
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
