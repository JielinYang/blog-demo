#!/bin/bash

# 修复 Docker 网络连接问题
# 用途: 解决后端无法连接 MySQL 的 EHOSTUNREACH 错误

set -e

echo "========================================="
echo "修复 Docker 网络连接问题"
echo "========================================="

# 进入项目目录
cd /opt/blog/blog-demo

echo ""
echo "步骤 1: 停止所有容器..."
docker-compose down

echo ""
echo "步骤 2: 清理所有未使用的网络..."
docker network prune -f

echo ""
echo "步骤 3: 检查并删除旧的博客网络(如果存在)..."
OLD_NETWORKS=$(docker network ls | grep blog | awk '{print $1}' || true)
if [ ! -z "$OLD_NETWORKS" ]; then
    echo "发现旧网络,正在删除..."
    echo "$OLD_NETWORKS" | xargs -r docker network rm || true
fi

echo ""
echo "步骤 4: 重新创建并启动所有服务..."
docker-compose up -d

echo ""
echo "步骤 5: 等待服务启动..."
sleep 15

echo ""
echo "步骤 6: 检查容器状态..."
docker-compose ps

echo ""
echo "步骤 7: 检查网络配置..."
docker network inspect blog-demo_blog-network | grep -A 5 "Containers"

echo ""
echo "步骤 8: 测试后端到 MySQL 的连接..."
docker exec blog-backend ping -c 3 mysql || echo "⚠️  Ping 失败(可能是容器内没有 ping 命令,这是正常的)"

echo ""
echo "步骤 9: 查看后端日志(最近 30 行)..."
docker-compose logs --tail=30 backend

echo ""
echo "========================================="
echo "修复完成!"
echo "========================================="
echo ""
echo "如果仍然有问题,请查看完整日志:"
echo "  docker-compose logs -f backend"
echo ""
