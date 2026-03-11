# RescapeR Docker Image - Multi-stage build with obfuscation
# 1. Build stage for JS obfuscation
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY playable-web/ ./playable-web/
# Obfuscate JS files in playable-web and preserve structure
# We output to a separate directory to avoid source contamination
RUN npx javascript-obfuscator ./playable-web --output ./dist --compact true --string-array true --string-array-rotate true --string-array-shuffle true --string-array-threshold 0.75 --self-defending false

# 2. Production stage
FROM nginx:alpine
LABEL maintainer="RescapeR Team"
LABEL description="RescapeR - IT 회사 탈출 로그라이트 액션 게임 (Obfuscated)"

WORKDIR /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# First copy all original assets (HTML, CSS, images, etc.)
COPY playable-web/ .

# Then overwrite JS files with obfuscated ones from builder stage
# javascript-obfuscator output will have the same relative paths as input
COPY --from=builder /app/dist/ ./

RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
