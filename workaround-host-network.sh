#!/bin/bash

# 临时解决方案：使用 host 网络模式
# 这会让容器直接使用宿主机网络，绕过 Docker 网络问题

set -e

echo "========================================"
echo "临时解决方案：切换到 host 网络模式"
echo "========================================"
echo ""
echo "⚠️  警告：此方案会改变网络架构"
echo "优点：可以快速解决连接问题"
echo "缺点：容器将直接使用宿主机网络，端口冲突风险增加"
echo ""
echo "按 Ctrl+C 取消，或按任意键继续..."
read -n 1 -s

cd /opt/blog/blog-demo

echo ""
echo "📋 步骤 1: 备份当前配置"
echo "----------------------------------------"
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ 已备份到 docker-compose.yml.backup-*"

echo ""
echo "🔧 步骤 2: 修改 docker-compose.yml"
echo "----------------------------------------"

cat > docker-compose.override.yml << 'EOF'
version: "3.8"

services:
  mysql:
    network_mode: "host"
    ports: []
    
  minio:
    network_mode: "host"
    ports: []
    
  backend:
    network_mode: "host"
    ports: []
    environment:
      MYSQL_HOST: 127.0.0.1
      MINIO_ENDPOINT: 127.0.0.1
EOF

echo "✅ 已创建 docker-compose.override.yml"

echo ""
echo "🔄 步骤 3: 重启服务"
echo "----------------------------------------"
docker-compose down
docker-compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 15

echo ""
echo "📊 步骤 4: 检查服务状态"
echo "----------------------------------------"
docker-compose ps

echo ""
echo "查看后端日志:"
docker-compose logs --tail=30 backend

echo ""
echo "========================================"
echo "临时方案已应用！"
echo "========================================"
echo ""
echo "📌 验证："
echo "curl http://localhost:3000/health"
echo ""
echo "📌 如需恢复原配置："
echo "rm docker-compose.override.yml"
echo "docker-compose down && docker-compose up -d"
echo ""
