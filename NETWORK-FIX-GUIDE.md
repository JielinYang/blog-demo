# Docker 网络连接问题解决指南

## 🚨 问题描述

**错误信息:**
```
❌ 数据库连接失败: connect EHOSTUNREACH 172.21.0.3:3306
Error: connect EHOSTUNREACH 172.21.0.3:3306
code: 'EHOSTUNREACH'
```

**错误含义:**
- `EHOSTUNREACH` = 主机不可达
- 后端容器无法访问 MySQL 容器

---

## 🔍 问题原因

可能的原因包括:

1. **网络配置不一致**
   - 旧容器使用旧网络
   - 新容器使用新网络
   - 容器之间无法通信

2. **网络名称冲突**
   - 你添加了 `name: blog-demo_blog-network`
   - 可能与现有网络冲突

3. **容器启动顺序问题**
   - MySQL 容器还未完全启动
   - 健康检查失败

---

## ✅ 解决方案

### 方案 1: 使用修复脚本(推荐)

```bash
# 1. SSH 到服务器
ssh user@106.14.179.11

# 2. 进入项目目录
cd /opt/blog/blog-demo

# 3. 赋予执行权限
chmod +x fix-network.sh

# 4. 运行修复脚本
./fix-network.sh
```

### 方案 2: 手动修复

```bash
# SSH 到服务器
ssh user@106.14.179.11
cd /opt/blog/blog-demo

# 步骤 1: 完全停止并删除所有容器
docker-compose down -v
# 注意: -v 会删除匿名卷,但不会删除命名卷(mysql_data 等)

# 步骤 2: 查看现有网络
docker network ls

# 步骤 3: 删除所有博客相关的旧网络
docker network rm $(docker network ls | grep blog | awk '{print $1}')

# 步骤 4: 清理所有未使用的网络
docker network prune -f

# 步骤 5: 重新启动服务
docker-compose up -d

# 步骤 6: 检查容器状态
docker-compose ps
```

---

## 🔬 诊断命令

### 1. 检查网络配置

```bash
# 查看网络详情
docker network inspect blog-demo_blog-network

# 应该看到以下容器都在这个网络中:
# - blog-mysql
# - blog-backend
# - blog-frontend
# - blog-minio
```

### 2. 检查容器网络连接

```bash
# 进入后端容器
docker exec -it blog-backend sh

# 尝试解析 MySQL 主机名
nslookup mysql || getent hosts mysql

# 应该返回 MySQL 容器的 IP 地址

# 尝试连接 MySQL(如果容器内有 nc 命令)
nc -zv mysql 3306

# 退出容器
exit
```

### 3. 检查 DNS 解析

```bash
# 查看后端容器的 /etc/hosts 和 DNS 配置
docker exec blog-backend cat /etc/hosts
docker exec blog-backend cat /etc/resolv.conf
```

### 4. 检查 MySQL 容器状态

```bash
# 查看 MySQL 日志
docker-compose logs mysql | tail -50

# 检查 MySQL 健康状态
docker inspect blog-mysql | grep -A 10 Health

# 应该看到 "Status": "healthy"
```

---

## 🛠️ 高级修复

### 如果上述方法都不行,尝试完全重置:

```bash
# ⚠️  警告: 这会删除所有容器和网络,但保留数据卷

# 1. 停止所有容器
docker-compose down

# 2. 删除所有博客相关的容器(包括停止的)
docker ps -a | grep blog | awk '{print $1}' | xargs docker rm -f

# 3. 删除所有博客相关的网络
docker network ls | grep blog | awk '{print $1}' | xargs docker network rm

# 4. 清理系统
docker system prune -f

# 5. 重新启动
docker-compose up -d
```

---

## 🔧 docker-compose.yml 优化建议

### 当前配置(可能有问题):

```yaml
networks:
  blog-network:
    name: blog-demo_blog-network  # 自定义名称
    driver: bridge
```

### 建议修改为(更简单):

```yaml
networks:
  blog-network:
    driver: bridge
    # 不指定 name,让 Docker Compose 自动生成
    # 格式: 项目名_网络名
```

**或者,如果你确实需要自定义名称:**

```yaml
networks:
  blog-network:
    name: blog-demo-network  # 使用连字符而非下划线
    driver: bridge
```

---

## 📊 验证步骤

修复后,按以下顺序验证:

### 1. 检查所有容器状态
```bash
docker-compose ps
```

应该看到:
```
NAME            STATUS          PORTS
blog-backend    Up (healthy)    0.0.0.0:3000->3000/tcp
blog-frontend   Up              0.0.0.0:80->80/tcp
blog-mysql      Up (healthy)    0.0.0.0:3306->3306/tcp
blog-minio      Up (healthy)    0.0.0.0:9000-9001->9000-9001/tcp
```

### 2. 检查后端日志
```bash
docker-compose logs backend | tail -20
```

应该看到:
```
✓ 数据库连接成功
✓ 数据库检查通过
服务器运行在端口 3000
```

### 3. 测试 API
```bash
# 在服务器上测试
curl http://localhost:3000/articles

# 从外部测试
curl http://www.fbranch.top/api/articles
```

### 4. 检查网络连通性
```bash
# 所有容器应该在同一个网络
docker network inspect blog-demo_blog-network --format '{{range $k, $v := .Containers}}{{$k}}: {{$v.Name}}{{"\n"}}{{end}}'
```

---

## 🎯 常见错误和解决方案

### 错误 1: `network blog-demo_blog-network not found`

**原因:** 网络不存在

**解决:**
```bash
docker-compose down
docker-compose up -d
```

### 错误 2: `network blog-demo_blog-network already exists`

**原因:** 旧网络还在

**解决:**
```bash
docker network rm blog-demo_blog-network
docker-compose up -d
```

### 错误 3: MySQL 健康检查失败

**原因:** MySQL 启动慢或配置错误

**解决:**
```bash
# 查看 MySQL 日志
docker-compose logs mysql

# 检查环境变量
docker exec blog-mysql env | grep MYSQL
```

---

## 📝 预防措施

### 1. 使用一致的网络配置

确保 docker-compose.yml 中所有服务都使用同一个网络:

```yaml
services:
  backend:
    networks:
      - blog-network  # 确保所有服务都用这个
  
  mysql:
    networks:
      - blog-network  # 确保所有服务都用这个
```

### 2. 使用健康检查

确保依赖服务已经健康后再启动:

```yaml
backend:
  depends_on:
    mysql:
      condition: service_healthy  # 等待健康检查通过
```

### 3. 定期清理

```bash
# 定期清理未使用的资源
docker system prune -f
docker volume prune -f
docker network prune -f
```

---

## 🆘 如果仍然无法解决

1. **查看完整日志:**
```bash
docker-compose logs > debug.log
cat debug.log
```

2. **检查环境变量:**
```bash
docker exec blog-backend env | grep DB_
```

3. **检查 .env 文件:**
```bash
cat .env
```

4. **重新部署:**
```bash
git pull
docker-compose down -v
docker-compose up -d --build
```

---

**修复成功的标志:**
- ✅ `docker-compose ps` 显示所有容器都是 `Up (healthy)`
- ✅ 后端日志显示 `✓ 数据库连接成功`
- ✅ 可以访问 `http://www.fbranch.top/api/articles`
