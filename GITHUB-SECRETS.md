# GitHub Secrets 配置完整指南

## 📋 概述

本指南将帮助你在 GitHub 仓库中配置所有必需的 Secrets,实现完全自动化的 CI/CD 部署。

---

## 🔐 需要配置的 Secrets 清单

### 必需配置(共 13 个)

| Secret 名称 | 说明 | 示例值 | 优先级 |
|------------|------|--------|--------|
| `DOCKER_USERNAME` | Docker Hub 用户名 | `yourname` | ⭐⭐⭐ |
| `DOCKER_PASSWORD` | Docker Hub 密码 | `your_password` | ⭐⭐⭐ |
| `SERVER_HOST` | 服务器 IP 地址 | `106.14.179.11` | ⭐⭐⭐ |
| `SERVER_USER` | SSH 用户名 | `root` | ⭐⭐⭐ |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN RSA...` | ⭐⭐⭐ |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | `SecurePass123!` | ⭐⭐⭐ |
| `MYSQL_DATABASE` | 数据库名称 | `blog_db` | ⭐⭐ |
| `MYSQL_USER` | 数据库用户名 | `blog_user` | ⭐⭐ |
| `MYSQL_PASSWORD` | 数据库密码 | `DbPass123!` | ⭐⭐⭐ |
| `JWT_SECRET` | JWT 密钥 | `your_32_char_secret_key_here` | ⭐⭐⭐ |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `minio_access` | ⭐⭐ |
| `MINIO_SECRET_KEY` | MinIO 密钥 | `minio_secret` | ⭐⭐ |
| `MINIO_BUCKET` | MinIO 存储桶名 | `blog-images` | ⭐ |
| `MINIO_PORT` | MinIO 端口 | `9000` | ⭐ |
| `VITE_API_BASE_URL` | 前端 API 地址 | `/api` | ⭐⭐⭐ |

---

## 🚀 配置步骤

### 第一步:访问 GitHub Secrets 设置

1. 打开你的 GitHub 仓库
2. 点击 **Settings**(设置)
3. 左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**(新建仓库密钥)

### 第二步:逐个添加 Secrets

#### 1. Docker Hub 配置

**DOCKER_USERNAME**
```
名称: DOCKER_USERNAME
值: 你的 Docker Hub 用户名
```

**DOCKER_PASSWORD**
```
名称: DOCKER_PASSWORD
值: 你的 Docker Hub 密码
```

> [!TIP]
> 建议使用 Docker Hub Access Token 而非密码,更安全!
> 生成方式: Docker Hub → Account Settings → Security → New Access Token

---

#### 2. 服务器 SSH 配置

**SERVER_HOST**
```
名称: SERVER_HOST
值: 106.14.179.11
```

**SERVER_USER**
```
名称: SERVER_USER
值: root
```
(或你的实际 SSH 用户名)

**SERVER_SSH_KEY**
```
名称: SERVER_SSH_KEY
值: (你的 SSH 私钥完整内容)
```

**如何获取 SSH 私钥:**
```bash
# 在本地电脑查看私钥
cat ~/.ssh/id_rsa

# 复制整个输出,包括:
# -----BEGIN RSA PRIVATE KEY-----
# ... (中间的密钥内容)
# -----END RSA PRIVATE KEY-----
```

> [!WARNING]
> 私钥内容很长,确保完整复制,包括开头和结尾的标记行!

---

#### 3. 数据库配置

**MYSQL_ROOT_PASSWORD**
```
名称: MYSQL_ROOT_PASSWORD
值: 你的 MySQL root 密码(建议使用强密码)
示例: MySecureRootPass123!@#
```

**MYSQL_DATABASE**
```
名称: MYSQL_DATABASE
值: blog_db
```

**MYSQL_USER**
```
名称: MYSQL_USER
值: blog_user
```

**MYSQL_PASSWORD**
```
名称: MYSQL_PASSWORD
值: 你的数据库用户密码
示例: BlogUserPass456!@#
```

> [!IMPORTANT]
> 密码建议包含大小写字母、数字和特殊字符,长度至少 12 位!

---

#### 4. JWT 密钥

**JWT_SECRET**
```
名称: JWT_SECRET
值: 至少 32 位的随机字符串
```

**生成强密钥的方法:**
```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法 3: 在线生成
# 访问: https://randomkeygen.com/
```

---

#### 5. MinIO 配置

**MINIO_ACCESS_KEY**
```
名称: MINIO_ACCESS_KEY
值: 你的 MinIO 访问密钥(至少 8 位)
示例: minio_admin_2024
```

**MINIO_SECRET_KEY**
```
名称: MINIO_SECRET_KEY
值: 你的 MinIO 密钥(至少 8 位)
示例: MinioSecretKey2024!
```

**MINIO_BUCKET**
```
名称: MINIO_BUCKET
值: blog-images
```

---

#### 6. 前端配置

**VITE_API_BASE_URL**
```
名称: VITE_API_BASE_URL
值: /api
```

> [!NOTE]
> 使用 `/api` 表示通过 Nginx 反向代理访问后端
> 如果要直接访问后端,可以设置为 `http://106.14.179.11:3000`

---

## ✅ 验证配置

配置完成后,你的 Secrets 列表应该包含以下 14 个项目:

```
✓ DOCKER_USERNAME
✓ DOCKER_PASSWORD
✓ SERVER_HOST
✓ SERVER_USER
✓ SERVER_SSH_KEY
✓ MYSQL_ROOT_PASSWORD
✓ MYSQL_DATABASE
✓ MYSQL_USER
✓ MYSQL_PASSWORD
✓ JWT_SECRET
✓ MINIO_ACCESS_KEY
✓ MINIO_SECRET_KEY
✓ MINIO_BUCKET
✓ VITE_API_BASE_URL
```

---

## 🎯 工作原理

### 构建阶段

```yaml
# GitHub Actions 读取 Secrets
build-args: |
  VITE_API_BASE_URL=${{ secrets.VITE_API_BASE_URL }}

# 注入到 Dockerfile
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Vite 构建时读取
RUN npm run build
```

### 部署阶段

```yaml
# GitHub Actions 在服务器上创建 .env 文件
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=${{ secrets.MYSQL_ROOT_PASSWORD }}
MYSQL_DATABASE=${{ secrets.MYSQL_DATABASE }}
...
EOF

# docker-compose 读取 .env
docker-compose up -d
```

---

## 🔧 测试部署

配置完成后,测试自动部署:

```bash
# 1. 提交一个小改动
echo "# Test" >> README.md
git add .
git commit -m "测试 CI/CD 自动部署"
git push origin main

# 2. 查看 GitHub Actions
# 访问: https://github.com/你的用户名/仓库名/actions

# 3. 观察工作流执行
# - build-backend: 应该成功
# - build-frontend: 应该成功
# - deploy: 应该成功

# 4. 访问网站验证
# http://www.fbranch.top
```

---

## 🐛 常见问题

### Q1: SSH 连接失败?

**错误信息:**
```
Permission denied (publickey)
```

**解决方案:**
1. 确认 `SERVER_SSH_KEY` 包含完整的私钥
2. 确认服务器上有对应的公钥:
```bash
ssh user@106.14.179.11
cat ~/.ssh/authorized_keys
# 应该包含你的公钥
```

### Q2: Docker Hub 登录失败?

**错误信息:**
```
Error: Cannot perform an interactive login from a non TTY device
```

**解决方案:**
- 检查 `DOCKER_USERNAME` 和 `DOCKER_PASSWORD` 是否正确
- 建议使用 Access Token 代替密码

### Q3: 环境变量没有生效?

**检查步骤:**
```bash
# SSH 到服务器
ssh user@106.14.179.11

# 查看 .env 文件
cd /opt/blog/blog-demo
cat .env

# 应该看到所有环境变量
```

---

## 📚 参考文档

- [GitHub Actions Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Build Args 文档](https://docs.docker.com/engine/reference/commandline/build/#build-arg)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)

---

## 🎉 完成!

配置完成后,你只需要:

```bash
git push
```

GitHub Actions 会自动:
1. ✅ 从 Secrets 读取配置
2. ✅ 构建前后端镜像
3. ✅ 推送到 Docker Hub
4. ✅ 在服务器创建 .env 文件
5. ✅ 部署最新版本

**享受全自动化部署吧! 🚀**
