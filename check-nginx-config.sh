#!/bin/bash

# 检查容器中的 Nginx 配置

echo "=========================================="
echo "检查容器中的 Nginx 配置"
echo "=========================================="
echo ""

echo "1. 检查主配置文件 /etc/nginx/nginx.conf 前30行："
echo "---"
docker exec blog-frontend head -n 30 /etc/nginx/nginx.conf
echo ""

echo "2. 检查是否包含 MinIO 代理配置："
echo "---"
docker exec blog-frontend grep -A 10 "location /minio/" /etc/nginx/nginx.conf
echo ""

echo "3. 检查 conf.d 目录："
echo "---"
docker exec blog-frontend ls -la /etc/nginx/conf.d/
echo ""

echo "4. 检查是否有 default.conf："
echo "---"
if docker exec blog-frontend test -f /etc/nginx/conf.d/default.conf; then
    echo "⚠️  default.conf 存在！"
    docker exec blog-frontend head -n 20 /etc/nginx/conf.d/default.conf
else
    echo "✅ default.conf 不存在"
fi
echo ""

echo "5. 测试 Nginx 配置："
echo "---"
docker exec blog-frontend nginx -t
echo ""

echo "6. 查看 Nginx 进程使用的配置文件："
echo "---"
docker exec blog-frontend nginx -T 2>&1 | head -n 50
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
