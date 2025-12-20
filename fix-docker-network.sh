#!/bin/bash

# Docker 容器网络连接修复脚本
# 解决 backend 无法连接 MySQL 和 MinIO 的 EHOSTUNREACH 错误

set -e

echo "========================================"
echo "Docker 网络诊断与修复工具"
echo "========================================"

# 进入项目目录
cd /opt/blog/blog-demo

echo ""
echo "📋 步骤 1: 诊断当前状态"
echo "----------------------------------------"
echo "当前运行的容器:"
docker-compose ps

echo ""
echo "当前网络列表:"
docker network ls | grep blog || echo "未找到博客相关网络"

echo ""
echo "🛑 步骤 2: 完全停止所有服务"
echo "----------------------------------------"
docker-compose down -v  # -v 参数会删除匿名卷，但保留命名卷

echo ""
echo "🧹 步骤 3: 清理网络资源"
echo "----------------------------------------"
# 删除所有未使用的网络
docker network prune -f

# 尝试删除可能存在的旧博客网络
echo "检查并删除旧的博客网络..."
docker network rm blog-demo_blog-network 2>/dev/null || echo "网络不存在或已删除"
docker network rm blog-network 2>/dev/null || echo "网络不存在或已删除"

echo ""
echo "🔄 步骤 4: 重新创建网络和容器"
echo "----------------------------------------"
# 使用 --force-recreate 强制重建所有容器
# 使用 --renew-anon-volumes 重新创建匿名卷
docker-compose up -d --force-recreate

echo ""
echo "⏳ 步骤 5: 等待服务完全启动"
echo "----------------------------------------"
echo "等待 MySQL 健康检查..."
for i in {1..30}; do
    if docker exec blog-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ MySQL 已就绪"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "等待 MinIO 健康检查..."
for i in {1..30}; do
    if docker exec blog-minio curl -f http://localhost:9000/minio/health/live 2>/dev/null >/dev/null; then
        echo "✅ MinIO 已就绪"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "等待后端服务启动..."
sleep 10

echo ""
echo "📊 步骤 6: 验证网络配置"
echo "----------------------------------------"
echo "容器状态:"
docker-compose ps

echo ""
echo "网络详情:"
docker network inspect blog-demo_blog-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'

echo ""
echo "🔍 步骤 7: 测试容器间网络连通性"
echo "----------------------------------------"

# 测试后端到 MySQL 的 DNS 解析
echo "测试 backend -> mysql DNS 解析:"
docker exec blog-backend nslookup mysql 2>/dev/null || \
docker exec blog-backend getent hosts mysql 2>/dev/null || \
echo "⚠️  无法测试 DNS（容器内可能缺少工具）"

# 测试后端到 MinIO 的 DNS 解析
echo ""
echo "测试 backend -> minio DNS 解析:"
docker exec blog-backend nslookup minio 2>/dev/null || \
docker exec blog-backend getent hosts minio 2>/dev/null || \
echo "⚠️  无法测试 DNS（容器内可能缺少工具）"

# 使用 Node.js 测试连接（更可靠）
echo ""
echo "使用 Node.js 测试数据库连接:"
docker exec blog-backend node -e "
const net = require('net');
const client = net.createConnection({ host: 'mysql', port: 3306 }, () => {
  console.log('✅ 成功连接到 MySQL (mysql:3306)');
  client.end();
});
client.on('error', (err) => {
  console.error('❌ 连接 MySQL 失败:', err.message);
  process.exit(1);
});
client.setTimeout(5000, () => {
  console.error('❌ 连接 MySQL 超时');
  client.destroy();
  process.exit(1);
});
" || echo "❌ MySQL 连接测试失败"

echo ""
echo "使用 Node.js 测试 MinIO 连接:"
docker exec blog-backend node -e "
const net = require('net');
const client = net.createConnection({ host: 'minio', port: 9000 }, () => {
  console.log('✅ 成功连接到 MinIO (minio:9000)');
  client.end();
});
client.on('error', (err) => {
  console.error('❌ 连接 MinIO 失败:', err.message);
  process.exit(1);
});
client.setTimeout(5000, () => {
  console.error('❌ 连接 MinIO 超时');
  client.destroy();
  process.exit(1);
});
" || echo "❌ MinIO 连接测试失败"

echo ""
echo "📝 步骤 8: 查看后端日志"
echo "----------------------------------------"
docker-compose logs --tail=50 backend

echo ""
echo "========================================"
echo "✅ 修复流程完成！"
echo "========================================"
echo ""
echo "📌 后续操作建议:"
echo "1. 查看完整后端日志: docker-compose logs -f backend"
echo "2. 查看所有服务日志: docker-compose logs -f"
echo "3. 重启单个服务: docker-compose restart backend"
echo "4. 查看网络详情: docker network inspect blog-demo_blog-network"
echo ""
