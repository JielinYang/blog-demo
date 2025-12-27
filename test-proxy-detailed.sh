#!/bin/bash

echo "=========================================="
echo "直接测试 MinIO 代理"
echo "=========================================="
echo ""

echo "1. 测试 MinIO 服务本身："
docker exec blog-frontend curl -v http://minio:9000/blog-images/default_head.jpg 2>&1 | grep -E "HTTP|< "
echo ""

echo "2. 测试容器内 HTTPS 访问（详细模式）："
docker exec blog-frontend curl -vk https://localhost/minio/blog-images/default_head.jpg 2>&1 | grep -E "HTTP|< |> "
echo ""

echo "3. 检查 Nginx 访问日志（最后5行）："
docker exec blog-frontend tail -n 5 /var/log/nginx/access.log
echo ""

echo "4. 测试一个肯定存在的 MinIO 文件："
echo "列出 MinIO 中的文件："
docker exec blog-minio mc ls local/blog-images/ 2>/dev/null || echo "mc 命令不可用"
echo ""

echo "5. 从外部直接访问 MinIO（HTTP）："
curl -I http://106.14.179.11:9000/blog-images/default_head.jpg 2>&1 | head -n 3
echo ""

echo "6. 测试 Nginx 是否正确处理 /minio/ 路径："
docker exec blog-frontend curl -v http://localhost:443 2>&1 | head -n 10
echo ""

echo "=========================================="
echo "完成"
echo "=========================================="
