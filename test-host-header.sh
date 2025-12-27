#!/bin/bash

echo "测试不同的 Host 头："
echo ""

echo "1. 使用原始 Host 头（fbranch.top）："
docker exec blog-frontend curl -v -H "Host: fbranch.top" http://minio:9000/blog-images/default_head.jpg 2>&1 | grep -E "HTTP|Host:"
echo ""

echo "2. 使用 minio:9000 作为 Host："
docker exec blog-frontend curl -v -H "Host: minio:9000" http://minio:9000/blog-images/default_head.jpg 2>&1 | grep -E "HTTP|Host:"
echo ""

echo "3. 不设置 Host 头："
docker exec blog-frontend curl -v http://minio:9000/blog-images/default_head.jpg 2>&1 | grep -E "HTTP|Host:"
echo ""

echo "4. 测试实际的代理请求（从容器内）："
docker exec blog-frontend sh -c 'curl -v -k https://localhost/minio/blog-images/default_head.jpg 2>&1' | grep -E "HTTP|X-|Host:|<"
echo ""

echo "5. 查看完整的 Nginx 配置中 proxy_set_header 部分："
docker exec blog-frontend grep -A 5 "proxy_set_header" /etc/nginx/nginx.conf | head -n 20
