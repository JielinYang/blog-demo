#!/bin/bash

# MinIO 代理诊断脚本

echo "=========================================="
echo "MinIO 代理诊断脚本"
echo "=========================================="
echo ""

# 1. 检查容器状态
echo "1. 检查容器状态..."
docker ps --filter "name=blog-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. 检查前端容器的 Nginx 配置
echo "2. 检查前端容器中的 Nginx 配置..."
echo "查找 /minio/ location 配置："
docker exec blog-frontend cat /etc/nginx/nginx.conf | grep -A 20 "location /minio/"
echo ""

# 3. 测试 Nginx 配置语法
echo "3. 测试 Nginx 配置语法..."
docker exec blog-frontend nginx -t
echo ""

# 4. 检查 Nginx 进程
echo "4. 检查 Nginx 进程..."
docker exec blog-frontend ps aux | grep nginx
echo ""

# 5. 测试从容器内部访问 MinIO
echo "5. 测试从前端容器内部访问 MinIO..."
docker exec blog-frontend curl -I http://minio:9000/blog-images/default_head.jpg 2>/dev/null | head -n 5
echo ""

# 6. 检查前端容器的网络连接
echo "6. 检查容器网络..."
docker network inspect blog-demo_blog-network | grep -A 5 "blog-frontend\|blog-minio"
echo ""

# 7. 查看前端容器日志（最后20行）
echo "7. 查看前端容器日志..."
docker logs --tail 20 blog-frontend
echo ""

# 8. 测试代理路径
echo "8. 测试 Nginx 代理（从容器内部）..."
docker exec blog-frontend curl -I http://localhost/minio/blog-images/default_head.jpg 2>/dev/null | head -n 5
echo ""

echo "=========================================="
echo "诊断完成！"
echo "=========================================="
echo ""
echo "修复建议："
echo "1. 如果 Nginx 配置中没有 /minio/ location，说明前端镜像没有重新构建"
echo "   解决：docker-compose build frontend && docker-compose up -d frontend"
echo ""
echo "2. 如果配置存在但测试失败，检查 MinIO 容器是否在同一网络"
echo "   解决：docker-compose restart minio frontend"
echo ""
echo "3. 如果一切正常但外部访问失败，可能是防火墙或 SSL 配置问题"
echo "   解决：检查服务器防火墙规则"
