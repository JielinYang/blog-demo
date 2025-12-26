# SSL 证书配置指南

本指南介绍如何为博客项目配置 SSL 证书，实现 HTTPS 访问。

## 目录

1. [获取 SSL 证书](#获取-ssl-证书)
2. [在服务器上配置证书](#在服务器上配置证书)
3. [配置 GitHub Secrets](#配置-github-secrets)
4. [验证配置](#验证配置)
5. [故障排除](#故障排除)

## 获取 SSL 证书

### 方法一：使用 Let's Encrypt（免费）

Let's Encrypt 提供免费的 SSL 证书，有效期 90 天，可自动续期。

```bash
# 安装 certbot
sudo apt update
sudo apt install certbot

# 获取证书（使用 standalone 模式，需要停止 nginx）
sudo certbot certonly --standalone -d fbranch.top -d www.fbranch.top

# 证书文件位置：
# 证书：/etc/letsencrypt/live/fbranch.top/fullchain.pem
# 私钥：/etc/letsencrypt/live/fbranch.top/privkey.pem
```

### 方法二：从云服务商获取

如果您使用阿里云、腾讯云等云服务商，可以在其控制台申请免费或付费的 SSL 证书。

下载证书后，通常会得到两个文件：
- `.pem` 或 `.crt` 文件（证书文件）
- `.key` 文件（私钥文件）

## 在服务器上配置证书

### 1. 创建证书目录

```bash
# 创建 SSL 证书存放目录
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 设置目录权限
sudo chmod 755 /etc/ssl/certs
sudo chmod 700 /etc/ssl/private
```

### 2. 上传证书文件

将证书文件上传到服务器：

```bash
# 方法一：使用 scp（在本地执行）
scp fbranch.top.pem user@your-server:/tmp/
scp fbranch.top.key user@your-server:/tmp/

# 方法二：使用 SFTP 或其他工具上传
```

### 3. 移动证书到正确位置

```bash
# 在服务器上执行
sudo mv /tmp/fbranch.top.pem /etc/ssl/certs/fbranch.top.pem
sudo mv /tmp/fbranch.top.key /etc/ssl/private/fbranch.top.key

# 设置文件权限
sudo chmod 644 /etc/ssl/certs/fbranch.top.pem
sudo chmod 600 /etc/ssl/private/fbranch.top.key
```

### 4. 验证证书文件

```bash
# 检查证书文件是否存在
ls -l /etc/ssl/certs/fbranch.top.pem
ls -l /etc/ssl/private/fbranch.top.key

# 验证证书内容
openssl x509 -in /etc/ssl/certs/fbranch.top.pem -text -noout

# 验证私钥
openssl rsa -in /etc/ssl/private/fbranch.top.key -check
```

## 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

### 必需的 SSL Secrets

1. **SSL_CERT_PATH**
   - 值：`/etc/ssl/certs/fbranch.top.pem`
   - 说明：服务器上证书文件的绝对路径

2. **SSL_KEY_PATH**
   - 值：`/etc/ssl/private/fbranch.top.key`
   - 说明：服务器上私钥文件的绝对路径

### 配置步骤

1. 进入 GitHub 仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加上述两个 Secret

## 验证配置

### 1. 触发部署

推送代码到 `main` 或 `master` 分支，触发自动部署：

```bash
git add .
git commit -m "Add SSL certificate configuration"
git push origin master
```

### 2. 检查 GitHub Actions 日志

在 GitHub Actions 页面查看部署日志，确认：
- `.env` 文件包含 SSL 配置
- Docker Compose 成功启动所有容器

### 3. 检查容器状态

SSH 登录服务器，检查容器状态：

```bash
# 查看所有容器状态
docker ps -a

# 查看前端容器日志
docker logs blog-frontend

# 应该看到 nginx 成功启动，没有 SSL 错误
```

### 4. 测试 HTTPS 访问

```bash
# 测试 HTTPS 访问
curl -I https://fbranch.top

# 测试 HTTP 重定向
curl -I http://fbranch.top

# 应该看到 301 重定向到 HTTPS
```

### 5. 浏览器测试

在浏览器中访问：
- `https://fbranch.top` - 应该显示安全锁图标
- `http://fbranch.top` - 应该自动重定向到 HTTPS

## 故障排除

### 问题 1：nginx 无法加载证书

**错误信息**：
```
nginx: [emerg] cannot load certificate "/etc/nginx/ssl/fbranch.top.pem": BIO_new_file() failed
```

**解决方案**：
1. 检查 GitHub Secrets 中 `SSL_CERT_PATH` 和 `SSL_KEY_PATH` 是否正确配置
2. 检查服务器上证书文件是否存在：
   ```bash
   ls -l /etc/ssl/certs/fbranch.top.pem
   ls -l /etc/ssl/private/fbranch.top.key
   ```
3. 检查文件权限：
   ```bash
   sudo chmod 644 /etc/ssl/certs/fbranch.top.pem
   sudo chmod 600 /etc/ssl/private/fbranch.top.key
   ```

### 问题 2：证书过期

**错误信息**：浏览器显示证书已过期

**解决方案**：
1. 如果使用 Let's Encrypt，设置自动续期：
   ```bash
   # 测试续期
   sudo certbot renew --dry-run
   
   # 添加自动续期任务（每天检查两次）
   sudo crontab -e
   # 添加以下行：
   0 0,12 * * * certbot renew --quiet --post-hook "docker restart blog-frontend"
   ```

2. 如果使用其他证书，手动更新证书文件并重启容器：
   ```bash
   docker restart blog-frontend
   ```

### 问题 3：证书域名不匹配

**错误信息**：浏览器显示证书域名不匹配

**解决方案**：
确保证书包含您访问的域名。检查证书支持的域名：
```bash
openssl x509 -in /etc/ssl/certs/fbranch.top.pem -text -noout | grep DNS
```

### 问题 4：混合内容警告

**错误信息**：浏览器控制台显示混合内容（Mixed Content）警告

**解决方案**：
确保所有资源（图片、CSS、JS 等）都使用 HTTPS 加载。检查前端代码中的资源引用。

## 证书续期

### Let's Encrypt 自动续期

Let's Encrypt 证书有效期为 90 天，建议设置自动续期：

```bash
# 创建续期脚本
sudo nano /opt/renew-ssl.sh
```

添加以下内容：
```bash
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    docker restart blog-frontend
    echo "SSL certificate renewed successfully at $(date)" >> /var/log/ssl-renew.log
fi
```

设置权限并添加定时任务：
```bash
sudo chmod +x /opt/renew-ssl.sh
sudo crontab -e
# 添加：每天凌晨 2 点检查续期
0 2 * * * /opt/renew-ssl.sh
```

## 安全建议

1. **定期更新证书**：确保证书在过期前及时更新
2. **保护私钥**：私钥文件权限应设置为 600，仅 root 可读
3. **使用强加密**：nginx.conf 中已配置了推荐的加密套件
4. **启用 HSTS**：nginx.conf 中已启用 HSTS，强制浏览器使用 HTTPS
5. **监控证书状态**：定期检查证书有效期和配置

## 相关文件

- [nginx.conf](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/yjl-blog-frontend-demo/nginx.conf) - Nginx 配置文件
- [docker-compose.yml](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/docker-compose.yml) - Docker Compose 配置
- [deploy.yml](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/.github/workflows/deploy.yml) - GitHub Actions 部署工作流

## 参考资料

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Certbot 使用指南](https://certbot.eff.org/)
- [Nginx SSL 配置最佳实践](https://ssl-config.mozilla.org/)
