# 第一阶段: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖(包括 devDependencies)
RUN npm ci

# 复制应用代码
COPY . .

# 设置构建时环境变量
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# MinIO 配置(构建时注入)
ARG VITE_MINIO_ENDPOINT
ARG VITE_MINIO_PORT
ARG VITE_MINIO_ACCESS_KEY
ARG VITE_MINIO_SECRET_KEY
ARG VITE_MINIO_BUCKET
ARG VITE_MINIO_LIFE_DIR
ARG SSL_CERT_PATH
ARG SSL_KEY_PATH

ENV VITE_MINIO_ENDPOINT=$VITE_MINIO_ENDPOINT
ENV VITE_MINIO_PORT=$VITE_MINIO_PORT
ENV VITE_MINIO_ACCESS_KEY=$VITE_MINIO_ACCESS_KEY
ENV VITE_MINIO_SECRET_KEY=$VITE_MINIO_SECRET_KEY
ENV VITE_MINIO_BUCKET=$VITE_MINIO_BUCKET
ENV VITE_MINIO_LIFE_DIR=$VITE_MINIO_LIFE_DIR
ENV SSL_CERT_PATH=$SSL_CERT_PATH
ENV SSL_KEY_PATH=$SSL_KEY_PATH

# 构建生产版本
RUN npm run build

# 第二阶段: 生产阶段
FROM nginx:alpine

# 创建 SSL 证书目录
RUN mkdir -p /etc/nginx/ssl

# 删除默认配置，复制自定义 nginx 配置
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 80 和 443 端口
EXPOSE 80 443

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
