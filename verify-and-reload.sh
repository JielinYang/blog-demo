#!/bin/bash

echo "=========================================="
echo "验证并强制重新加载 Nginx 配置"
echo "=========================================="
echo ""

echo "1. 检查容器中 location 规则的顺序："
echo "---"
docker exec blog-frontend grep -n "location" /etc/nginx/nginx.conf | head -n 10
echo ""

echo "2. 检查 /minio/ location 在文件中的位置："
echo "---"
docker exec blog-frontend grep -n "location /minio/" /etc/nginx/nginx.conf
echo ""

echo "3. 检查 location / 在文件中的位置："
echo "---"
docker exec blog-frontend grep -n "location /" /etc/nginx/nginx.conf
echo ""

echo "4. 查看 location /minio/ 前后的内容："
echo "---"
docker exec blog-frontend sed -n '60,100p' /etc/nginx/nginx.conf
echo ""

echo "5. 强制重新加载 Nginx 配置："
echo "---"
docker exec blog-frontend nginx -s reload
echo "✅ Nginx 已重新加载"
echo ""

echo "6. 重启 Nginx 进程："
echo "---"
docker-compose restart frontend
echo "✅ 前端容器已重启"
echo ""

echo "7. 等待容器启动..."
sleep 10
echo ""

echo "8. 测试访问："
echo "---"
curl -I https://fbranch.top/minio/blog-images/default_head.jpg 2>&1 | head -n 5
echo ""

echo "9. 查看最新的错误日志："
echo "---"
docker exec blog-frontend tail -n 5 /var/log/nginx/error.log
echo ""

echo "=========================================="
echo "完成"
echo "=========================================="
