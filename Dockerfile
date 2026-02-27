# RescapeR Docker Image
# Static web game served with Nginx

FROM nginx:alpine

LABEL maintainer="RescapeR Team"
LABEL description="RescapeR - IT 회사 탈출 로그라이트 액션 게임"

# 작업 디렉토리 설정
WORKDIR /usr/share/nginx/html

# 기본 nginx 설정 제거 및 커스텀 설정 복사
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 게임 파일 복사 (playable-web 디렉토리의 내용을 루트로)
COPY playable-web/ .

# 권한 설정
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
