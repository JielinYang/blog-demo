#!/bin/bash

# Docker 深度网络诊断脚本
# 用于诊断 DNS 解析正常但 TCP 连接失败的问题

set -e

echo "========================================"
echo "Docker 深度网络诊断"
echo "========================================"

cd /opt/blog/blog-demo

echo ""
echo "📋 步骤 1: 基础信息收集"
echo "----------------------------------------"
echo "Docker 版本:"
docker --version
docker-compose --version

echo ""
echo "内核版本:"
uname -r

echo ""
echo "📊 步骤 2: 检查容器网络模式"
echo "----------------------------------------"
echo "MySQL 容器网络详情:"
docker inspect blog-mysql --format '{{json .NetworkSettings.Networks}}' | jq '.'

echo ""
echo "MinIO 容器网络详情:"
docker inspect blog-minio --format '{{json .NetworkSettings.Networks}}' | jq '.'

echo ""
echo "Backend 容器网络详情:"
docker inspect blog-backend --format '{{json .NetworkSettings.Networks}}' | jq '.'

echo ""
echo "🔍 步骤 3: 检查网络驱动和配置"
echo "----------------------------------------"
docker network inspect blog-demo_blog-network --format '{{json .}}' | jq '{Name: .Name, Driver: .Driver, Scope: .Scope, Internal: .Internal, EnableIPv6: .EnableIPv6, IPAM: .IPAM, Options: .Options}'

echo ""
echo "🛡️ 步骤 4: 检查 iptables 规则"
echo "----------------------------------------"
echo "Docker 相关的 FORWARD 规则:"
sudo iptables -L FORWARD -n -v | grep -E "DOCKER|ACCEPT|DROP" || echo "无相关规则"

echo ""
echo "Docker 网络的 NAT 规则:"
sudo iptables -t nat -L DOCKER -n -v 2>/dev/null || echo "无 DOCKER 链"

echo ""
echo "Docker 隔离规则:"
sudo iptables -L DOCKER-ISOLATION-STAGE-1 -n -v 2>/dev/null || echo "无隔离规则"

echo ""
echo "🔌 步骤 5: 测试容器内部网络工具"
echo "----------------------------------------"
echo "检查 backend 容器内的网络配置:"
docker exec blog-backend ip addr show eth0 || echo "无法查看网络接口"

echo ""
echo "检查 backend 容器的路由表:"
docker exec blog-backend ip route || echo "无法查看路由表"

echo ""
echo "🧪 步骤 6: 从 backend 容器 ping 其他容器"
echo "----------------------------------------"
echo "Ping MySQL (172.25.0.2):"
docker exec blog-backend ping -c 3 172.25.0.2 || echo "❌ Ping 失败"

echo ""
echo "Ping MinIO (172.25.0.3):"
docker exec blog-backend ping -c 3 172.25.0.3 || echo "❌ Ping 失败"

echo ""
echo "🔧 步骤 7: 测试端口连通性（使用 nc）"
echo "----------------------------------------"
echo "测试 MySQL 3306 端口:"
docker exec blog-backend timeout 5 nc -zv mysql 3306 2>&1 || echo "❌ 端口不通"

echo ""
echo "测试 MinIO 9000 端口:"
docker exec blog-backend timeout 5 nc -zv minio 9000 2>&1 || echo "❌ 端口不通"

echo ""
echo "📦 步骤 8: 检查容器是否正在监听端口"
echo "----------------------------------------"
echo "MySQL 容器监听的端口:"
docker exec blog-mysql netstat -tlnp 2>/dev/null | grep 3306 || \
docker exec blog-mysql ss -tlnp 2>/dev/null | grep 3306 || \
echo "⚠️  无法检查（可能缺少 netstat/ss 工具）"

echo ""
echo "MinIO 容器监听的端口:"
docker exec blog-minio netstat -tlnp 2>/dev/null | grep 9000 || \
docker exec blog-minio ss -tlnp 2>/dev/null | grep 9000 || \
echo "⚠️  无法检查（可能缺少 netstat/ss 工具）"

echo ""
echo "🔍 步骤 9: 检查 Docker 网络驱动问题"
echo "----------------------------------------"
echo "检查 Docker 守护进程日志（最近 50 行）:"
sudo journalctl -u docker --no-pager -n 50 | grep -i "error\|warn\|network" || echo "无错误或警告"

echo ""
echo "🌐 步骤 10: 检查宿主机防火墙状态"
echo "----------------------------------------"
echo "UFW 状态:"
sudo ufw status 2>/dev/null || echo "UFW 未安装或未启用"

echo ""
echo "Firewalld 状态:"
sudo firewall-cmd --state 2>/dev/null || echo "Firewalld 未安装或未运行"

echo ""
echo "🧩 步骤 11: 检查 Docker 网络隔离"
echo "----------------------------------------"
echo "检查是否启用了 ICC (Inter-Container Communication):"
docker network inspect blog-demo_blog-network --format '{{.Options}}' | grep -i "com.docker.network.bridge.enable_icc" || echo "未找到 ICC 配置"

echo ""
echo "检查网桥设备:"
ip link show | grep docker || echo "未找到 docker 网桥"
brctl show 2>/dev/null | grep docker || echo "无法查看网桥详情（brctl 未安装）"

echo ""
echo "========================================"
echo "诊断完成！"
echo "========================================"
echo ""
echo "📌 关键检查点："
echo "1. iptables FORWARD 链是否允许 Docker 流量"
echo "2. 容器是否在同一网络且 ICC 已启用"
echo "3. 防火墙是否阻止了容器间通信"
echo "4. MySQL 和 MinIO 是否正在监听正确的端口"
echo ""
