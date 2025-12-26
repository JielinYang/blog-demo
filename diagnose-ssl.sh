#!/bin/bash

echo "=========================================="
echo "SSL 证书诊断脚本"
echo "=========================================="
echo ""

# 检查证书文件是否存在
echo "1. 检查 SSL 证书文件..."
echo "-------------------------------------------"

if [ -f "/opt/ssl/fbranch.top.pem" ]; then
    echo "✅ 证书文件存在: /opt/ssl/fbranch.top.pem"
    ls -lh /opt/ssl/fbranch.top.pem
else
    echo "❌ 证书文件不存在: /opt/ssl/fbranch.top.pem"
fi

echo ""

if [ -f "/opt/ssl/fbranch.top.key" ]; then
    echo "✅ 私钥文件存在: /opt/ssl/fbranch.top.key"
    ls -lh /opt/ssl/fbranch.top.key
else
    echo "❌ 私钥文件不存在: /opt/ssl/fbranch.top.key"
fi

echo ""
echo "2. 检查 /opt/ssl 目录内容..."
echo "-------------------------------------------"
if [ -d "/opt/ssl" ]; then
    ls -lah /opt/ssl/
else
    echo "❌ 目录不存在: /opt/ssl"
fi

echo ""
echo "3. 检查 Docker 容器挂载..."
echo "-------------------------------------------"
docker inspect blog-frontend --format='{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Mode}}){{println}}{{end}}' 2>/dev/null || echo "容器未运行或不存在"

echo ""
echo "4. 检查容器内的证书文件..."
echo "-------------------------------------------"
docker exec blog-frontend ls -lh /etc/nginx/ssl/ 2>/dev/null || echo "无法访问容器或目录不存在"

echo ""
echo "5. 检查 .env 文件中的 SSL 配置..."
echo "-------------------------------------------"
if [ -f ".env" ]; then
    grep "SSL_" .env || echo "未找到 SSL 相关配置"
else
    echo "❌ .env 文件不存在"
fi

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
