#!/bin/bash

echo "=========================================="
echo "测试 MinIO 代理"
echo "=========================================="
echo ""

echo "1. 从容器内部测试 MinIO 连接："
docker exec blog-frontend curl -I http://minio:9000/blog-images/default_head.jpg 2>&1 | head -n 5
echo ""

echo "2. 从容器内部测试本地 Nginx 代理："
docker exec blog-frontend curl -I http://localhost/minio/blog-images/default_head.jpg 2>&1 | head -n 10
echo ""

echo "3. 从容器内部测试 HTTPS 代理："
docker exec blog-frontend curl -Ik https://localhost/minio/blog-images/default_head.jpg 2>&1 | head -n 10
echo ""

echo "4. 查看完整的 MinIO location 配置："
docker exec blog-frontend grep -A 25 "location /minio/" /etc/nginx/nginx.conf
echo ""

echo "5. 检查 Nginx 错误日志（最后10行）："
docker exec blog-frontend tail -n 10 /var/log/nginx/error.log
echo ""

echo "6. 重新加载 Nginx 配置："
docker exec blog-frontend nginx -s reload
echo "✅ Nginx 配置已重新加载"
echo ""

echo "7. 等待3秒后测试外部访问："
sleep 3
curl -I https://fbranch.top/minio/blog-images/default_head.jpg 2>&1 | head -n 5
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
