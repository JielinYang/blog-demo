# 快速修复指南

## 🚨 当前问题

- ✅ DNS 解析正常（mysql → 172.25.0.2, minio → 172.25.0.3）
- ❌ TCP 连接失败（EHOSTUNREACH 错误）

**根本原因**：iptables 防火墙规则阻止了容器间的网络流量。

## ⚡ 快速修复（推荐顺序）

### 选项 1：自动修复 iptables（推荐）⭐⭐⭐⭐⭐

```bash
cd /opt/blog/blog-demo
chmod +x fix-iptables.sh
./fix-iptables.sh
```

**预计时间**：2-3 分钟  
**成功率**：90%  
**风险**：低（会自动备份规则）

---

### 选项 2：深度诊断后手动修复

**步骤 1：收集诊断信息**
```bash
chmod +x diagnose-network-deep.sh
./diagnose-network-deep.sh > diagnosis.log 2>&1
```

**步骤 2：查看诊断结果**
```bash
cat diagnosis.log
```

**步骤 3：根据结果采取行动**
- 如果看到 `FORWARD (policy DROP)`，运行 `fix-iptables.sh`
- 如果看到 UFW 启用，临时禁用测试：`sudo ufw disable`
- 如果看到 SELinux enforcing，临时禁用测试：`sudo setenforce 0`

---

### 选项 3：临时绕过（快速但不推荐）

```bash
chmod +x workaround-host-network.sh
./workaround-host-network.sh
```

**预计时间**：1 分钟  
**成功率**：95%  
**风险**：中（失去网络隔离）

> [!CAUTION]
> 此方案仅用于紧急情况，不适合长期使用

## 🔍 验证修复

修复后运行以下命令验证：

```bash
# 测试连接
docker exec blog-backend node -e "
const net = require('net');
const mysql = net.createConnection({ host: 'mysql', port: 3306 });
mysql.on('connect', () => { console.log('✅ MySQL OK'); mysql.end(); });
mysql.on('error', (e) => { console.log('❌ MySQL FAIL:', e.message); });
"

# 查看后端日志
docker-compose logs backend | tail -20
```

**期望看到**：
```
✅ 数据库连接成功 (production环境)
MinIO连接初始化成功
```

## 📞 如果仍然失败

请运行诊断并提供结果：

```bash
./diagnose-network-deep.sh > full-diagnosis.log 2>&1

# 查看关键信息
echo "=== iptables FORWARD ==="
sudo iptables -L FORWARD -n -v | head -10

echo "=== Ping 测试 ==="
docker exec blog-backend ping -c 2 172.25.0.2

echo "=== 防火墙状态 ==="
sudo ufw status || sudo firewall-cmd --state || echo "无防火墙"
```

## 📋 脚本说明

| 脚本 | 用途 | 风险 | 时间 |
|------|------|------|------|
| `fix-iptables.sh` | 自动修复防火墙规则 | 低 | 2-3分钟 |
| `diagnose-network-deep.sh` | 深度诊断收集信息 | 无 | 1分钟 |
| `workaround-host-network.sh` | 临时绕过网络问题 | 中 | 1分钟 |
| `fix-docker-network.sh` | 基础网络重建 | 低 | 2分钟 |
