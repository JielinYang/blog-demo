#!/bin/bash

# 博客自动部署脚本
# 用途: 拉取最新 Docker 镜像并重启服务

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始部署博客应用..."
echo "========================================="

# 进入项目目录
cd /opt/blog/blog-demo

# 拉取最新镜像
echo "正在拉取最新 Docker 镜像..."
docker-compose pull

# 停止并删除旧容器
echo "正在停止旧容器..."
docker-compose down

# 启动新容器
echo "正在启动新容器..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 清理未使用的镜像
echo "清理未使用的镜像..."
docker image prune -f

echo "========================================="
echo "部署完成!"
echo "========================================="

# 显示日志(可选)
# docker-compose logs -f --tail=100
