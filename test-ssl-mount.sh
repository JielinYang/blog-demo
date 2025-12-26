#!/bin/bash

echo "=========================================="
echo "SSL 挂载测试脚本"
echo "=========================================="
echo ""

echo "1. 检查 .env 文件中的 SSL 变量..."
echo "-------------------------------------------"
source .env 2>/dev/null
echo "SSL_CERT_PATH=${SSL_CERT_PATH}"
echo "SSL_KEY_PATH=${SSL_KEY_PATH}"

echo ""
echo "2. 验证源文件存在..."
echo "-------------------------------------------"
if [ -f "${SSL_CERT_PATH}" ]; then
    echo "✅ 证书文件存在: ${SSL_CERT_PATH}"
    ls -lh "${SSL_CERT_PATH}"
else
    echo "❌ 证书文件不存在: ${SSL_CERT_PATH}"
fi

if [ -f "${SSL_KEY_PATH}" ]; then
    echo "✅ 私钥文件存在: ${SSL_KEY_PATH}"
    ls -lh "${SSL_KEY_PATH}"
else
    echo "❌ 私钥文件不存在: ${SSL_KEY_PATH}"
fi

echo ""
echo "3. 测试 Docker 挂载（使用临时容器）..."
echo "-------------------------------------------"
docker run --rm \
  -v ${SSL_CERT_PATH}:/test/cert.pem:ro \
  -v ${SSL_KEY_PATH}:/test/key.key:ro \
  alpine:latest \
  sh -c "ls -lh /test/ && echo '✅ 挂载成功' || echo '❌ 挂载失败'"

echo ""
echo "4. 检查当前容器的挂载配置..."
echo "-------------------------------------------"
docker inspect blog-frontend --format='{{range .Mounts}}Source: {{.Source}} -> Destination: {{.Destination}} (Mode: {{.Mode}}, RW: {{.RW}}){{println}}{{end}}' 2>/dev/null || echo "容器未运行"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
