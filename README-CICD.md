# CI/CD 自动化部署快速指南

## 🎯 一分钟了解

推送代码到 GitHub → 自动构建 → 自动部署 → 完成! 🎉

---

## 📝 配置清单

### 第一步:GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets:

- [ ] `DOCKER_USERNAME` - Docker Hub 用户名
- [ ] `DOCKER_PASSWORD` - Docker Hub 密码  
- [ ] `SERVER_HOST` - 服务器 IP
- [ ] `SERVER_USER` - SSH 用户名
- [ ] `SERVER_SSH_KEY` - SSH 私钥

### 第二步:服务器准备

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 创建项目目录
sudo mkdir -p /opt/blog
cd /opt/blog

# 3. 配置环境变量
cp .env.example .env
nano .env  # 修改数据库密码等敏感信息

# 4. 修改 docker-compose.yml 中的镜像名称
# 将 ${{ secrets.DOCKER_USERNAME }} 替换为你的 Docker Hub 用户名
```

### 第三步:推送代码

```bash
git add .
git commit -m "配置 CI/CD"
git push origin main
```

---

## 🚀 使用方式

### 自动部署
每次推送代码到 `main` 分支,自动触发部署:
```bash
git push origin main
```

### 查看部署状态
访问 GitHub 仓库 → Actions 标签 → 查看工作流运行状态

### 手动部署
在服务器上执行:
```bash
cd /opt/blog
./deploy.sh
```

---

## 🔍 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 完全重建
docker-compose up -d --build --force-recreate
```

---

## ❓ 遇到问题?

查看详细文档: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📦 项目结构

```
yjl-blog-demo/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 工作流
├── yjl-blog-backend-demo/
│   ├── Dockerfile              # 后端 Docker 配置
│   └── .dockerignore
├── yjl-blog-frontend-demo/
│   ├── Dockerfile              # 前端 Docker 配置
│   ├── nginx.conf              # Nginx 配置
│   └── .dockerignore
├── docker-compose.yml          # Docker Compose 编排
├── deploy.sh                   # 服务器部署脚本
├── .env.example                # 环境变量模板
├── DEPLOYMENT.md               # 详细部署文档
└── README-CICD.md              # 本文件
```

---

**享受自动化部署带来的便利吧! 🚀**
