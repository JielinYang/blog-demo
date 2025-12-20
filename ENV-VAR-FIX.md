# 环境变量不生效问题诊断

## 🚨 问题现象

修改了 `docker-compose.yml` 中的环境变量名(从 `DB_*` 改为 `MYSQL_*`),推送代码并重新部署后,容器中的环境变量仍然是旧的 `DB_*`。

```bash
# 服务器上查看
docker exec blog-backend env | grep DB_
# 输出: DB_HOST=mysql, DB_PASSWORD=xxx ...
```

---

## 🔍 根本原因

**GitHub Actions 部署脚本只拉取 Docker 镜像,不拉取代码!**

```yaml
# 旧的部署脚本
script: |
  cd /opt/blog/blog-demo
  docker-compose pull      # ← 只拉取镜像
  docker-compose up -d     # ← 使用服务器上的旧 docker-compose.yml
```

**结果:**
- 服务器上的 `docker-compose.yml` 还是旧版本(包含 `DB_*` 变量)
- 即使镜像是新的,但启动时使用的配置文件是旧的
- 所以容器中注入的环境变量还是旧的

---

## ✅ 解决方案

### 已修复:添加 git pull 步骤

```yaml
# 新的部署脚本
script: |
  cd /opt/blog/blog-demo
  git pull origin main     # ← 拉取最新代码和配置文件
  docker-compose pull
  docker-compose up -d
```

### 立即生效的步骤

1. **提交并推送修改:**
```bash
git add .github/workflows/deploy.yml
git commit -m "修复:部署时拉取最新配置文件"
git push origin main
```

2. **或者手动在服务器上更新:**
```bash
ssh user@106.14.179.11
cd /opt/blog/blog-demo
git pull origin main
docker-compose down
docker-compose up -d
```

---

## 📊 验证步骤

```bash
# 1. 检查 docker-compose.yml
cat /opt/blog/blog-demo/docker-compose.yml | grep -A 10 "backend:" | grep MYSQL

# 应该看到 MYSQL_HOST, MYSQL_PASSWORD 等

# 2. 检查容器环境变量
docker exec blog-backend env | grep MYSQL

# 应该看到 MYSQL_* 变量

# 3. 不应该再有 DB_* 变量
docker exec blog-backend env | grep "^DB_"

# 应该没有输出
```

---

## 💡 经验教训

**部署时需要同步的内容:**
1. ✅ Docker 镜像(代码)
2. ✅ 配置文件(`docker-compose.yml`, `nginx.conf` 等)
3. ✅ 环境变量(`.env` 文件)

**之前的问题:**
- ❌ 只同步了镜像
- ❌ 配置文件没有更新

**现在的方案:**
- ✅ `git pull` 更新所有文件
- ✅ `docker-compose pull` 拉取最新镜像
- ✅ `docker-compose up -d` 使用最新配置启动
