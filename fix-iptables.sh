#!/bin/bash

# 修复 Docker iptables 规则
# 解决容器间 TCP 连接 EHOSTUNREACH 问题

set -e

echo "========================================"
echo "修复 Docker iptables 规则"
echo "========================================"

echo ""
echo "⚠️  此脚本将修改 iptables 规则，请确保你了解操作的影响"
echo "按 Ctrl+C 取消，或按任意键继续..."
read -n 1 -s

echo ""
echo "📋 步骤 1: 备份当前 iptables 规则"
echo "----------------------------------------"
sudo iptables-save > /tmp/iptables-backup-$(date +%Y%m%d-%H%M%S).rules
echo "✅ 规则已备份到 /tmp/iptables-backup-*.rules"

echo ""
echo "🔍 步骤 2: 检查当前 FORWARD 策略"
echo "----------------------------------------"
FORWARD_POLICY=$(sudo iptables -L FORWARD -n | grep "^Chain FORWARD" | awk '{print $4}' | tr -d '()')
echo "当前 FORWARD 链默认策略: $FORWARD_POLICY"

if [ "$FORWARD_POLICY" = "DROP" ]; then
    echo "⚠️  FORWARD 链默认策略是 DROP，这可能导致容器间通信失败"
fi

echo ""
echo "🛠️ 步骤 3: 添加 Docker 网络允许规则"
echo "----------------------------------------"

# 获取 Docker 网络的子网
DOCKER_SUBNET=$(docker network inspect blog-demo_blog-network --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
echo "Docker 网络子网: $DOCKER_SUBNET"

# 确保 Docker 网络内的流量被允许
echo "添加规则：允许 Docker 网络内的所有流量..."
sudo iptables -C FORWARD -s $DOCKER_SUBNET -j ACCEPT 2>/dev/null || \
sudo iptables -I FORWARD 1 -s $DOCKER_SUBNET -j ACCEPT

sudo iptables -C FORWARD -d $DOCKER_SUBNET -j ACCEPT 2>/dev/null || \
sudo iptables -I FORWARD 1 -d $DOCKER_SUBNET -j ACCEPT

echo "✅ 规则已添加"

echo ""
echo "🔄 步骤 4: 重启 Docker 服务"
echo "----------------------------------------"
echo "停止所有容器..."
cd /opt/blog/blog-demo
docker-compose down

echo ""
echo "重启 Docker 守护进程..."
sudo systemctl restart docker

echo ""
echo "等待 Docker 启动..."
sleep 5

echo ""
echo "重新启动容器..."
docker-compose up -d

echo ""
echo "等待服务就绪..."
sleep 15

echo ""
echo "📊 步骤 5: 验证修复结果"
echo "----------------------------------------"
echo "当前 FORWARD 规则:"
sudo iptables -L FORWARD -n -v | head -20

echo ""
echo "测试容器间连接..."
docker exec blog-backend node -e "
const net = require('net');

const testConnection = (host, port, name) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host, port }, () => {
      console.log(\`✅ ${name} 连接成功 (${host}:${port})\`);
      client.end();
      resolve();
    });
    client.on('error', (err) => {
      console.error(\`❌ ${name} 连接失败:, err.message\`);
      reject(err);
    });
    client.setTimeout(5000, () => {
      console.error(\`❌ ${name} 连接超时\`);
      client.destroy();
      reject(new Error('timeout'));
    });
  });
};

Promise.all([
  testConnection('mysql', 3306, 'MySQL'),
  testConnection('minio', 9000, 'MinIO')
]).then(() => {
  console.log('');
  console.log('🎉 所有服务连接正常！');
  process.exit(0);
}).catch(err => {
  console.log('');
  console.error('⚠️  仍有连接问题，请查看详细日志');
  process.exit(1);
});
"

echo ""
echo "查看后端日志:"
docker-compose logs --tail=30 backend

echo ""
echo "========================================"
echo "修复完成！"
echo "========================================"
echo ""
echo "📌 如果问题仍然存在，可能需要："
echo "1. 检查云服务器安全组设置"
echo "2. 禁用宿主机防火墙测试: sudo ufw disable"
echo "3. 完全重置 Docker 网络: sudo systemctl restart docker"
echo "4. 检查 SELinux 状态: getenforce"
echo ""
echo "恢复 iptables 备份: sudo iptables-restore < /tmp/iptables-backup-*.rules"
echo ""
