# SSL 证书文件缺失问题修复指南

## 问题描述

前端容器报错：
```
[emerg] cannot load certificate "/etc/nginx/ssl/fbranch.top.pem": BIO_new_file() failed
```

**原因**：虽然 GitHub Secrets 中配置了 `SSL_CERT_PATH=/opt/ssl/fbranch.top.pem`，但服务器上该路径下可能没有实际的证书文件。

## 快速诊断

SSH 登录到服务器，运行诊断脚本：

```bash
cd /opt/blog/blog-demo
bash diagnose-ssl.sh
```

诊断脚本会检查：
- SSL 证书文件是否存在
- 文件权限是否正确
- Docker 挂载配置
- 容器内文件状态

## 解决方案

### 方案一：使用 Let's Encrypt 免费证书（推荐）

#### 1. 安装 Certbot

```bash
sudo apt update
sudo apt install certbot -y
```

#### 2. 停止前端容器（释放 80 和 443 端口）

```bash
cd /opt/blog/blog-demo
docker-compose stop frontend
```

#### 3. 获取证书

```bash
sudo certbot certonly --standalone -d fbranch.top -d www.fbranch.top
```

按提示输入邮箱地址，同意服务条款。

#### 4. 创建 SSL 目录并复制证书

```bash
# 创建目录
sudo mkdir -p /opt/ssl

# 复制证书文件
sudo cp /etc/letsencrypt/live/fbranch.top/fullchain.pem /opt/ssl/fbranch.top.pem
sudo cp /etc/letsencrypt/live/fbranch.top/privkey.pem /opt/ssl/fbranch.top.key

# 设置权限
sudo chmod 644 /opt/ssl/fbranch.top.pem
sudo chmod 600 /opt/ssl/fbranch.top.key
```

#### 5. 验证文件

```bash
ls -lh /opt/ssl/
```

应该看到：
```
-rw-r--r-- 1 root root 3.5K Dec 26 18:00 fbranch.top.pem
-rw------- 1 root root 1.7K Dec 26 18:00 fbranch.top.key
```

#### 6. 重启容器

```bash
cd /opt/blog/blog-demo
docker-compose up -d frontend
```

#### 7. 检查容器日志

```bash
docker logs blog-frontend
```

应该看到 nginx 成功启动，没有 SSL 错误。

#### 8. 设置自动续期

Let's Encrypt 证书 90 天过期，需要设置自动续期：

```bash
# 创建续期脚本
sudo tee /opt/renew-ssl.sh > /dev/null << 'EOF'
#!/bin/bash
certbot renew --quiet --pre-hook "cd /opt/blog/blog-demo && docker-compose stop frontend" --post-hook "cp /etc/letsencrypt/live/fbranch.top/fullchain.pem /opt/ssl/fbranch.top.pem && cp /etc/letsencrypt/live/fbranch.top/privkey.pem /opt/ssl/fbranch.top.key && cd /opt/blog/blog-demo && docker-compose up -d frontend"
EOF

# 设置权限
sudo chmod +x /opt/renew-ssl.sh

# 添加定时任务（每天凌晨 2 点检查）
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /opt/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | sudo crontab -
```

### 方案二：使用已有证书文件

如果您已经有证书文件（从云服务商购买或其他来源），请按以下步骤操作：

#### 1. 创建 SSL 目录

```bash
sudo mkdir -p /opt/ssl
```

#### 2. 上传证书文件

**方法 A：使用 scp（在本地电脑执行）**

```bash
scp fbranch.top.pem user@your-server:/tmp/
scp fbranch.top.key user@your-server:/tmp/
```

**方法 B：使用 SFTP 工具**

使用 FileZilla、WinSCP 等工具上传到 `/tmp/` 目录

#### 3. 移动文件到正确位置（在服务器上执行）

```bash
sudo mv /tmp/fbranch.top.pem /opt/ssl/fbranch.top.pem
sudo mv /tmp/fbranch.top.key /opt/ssl/fbranch.top.key

# 设置权限
sudo chmod 644 /opt/ssl/fbranch.top.pem
sudo chmod 600 /opt/ssl/fbranch.top.key
```

#### 4. 验证证书

```bash
# 查看证书信息
openssl x509 -in /opt/ssl/fbranch.top.pem -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After"

# 验证私钥
openssl rsa -in /opt/ssl/fbranch.top.key -check
```

#### 5. 重启容器

```bash
cd /opt/blog/blog-demo
docker-compose restart frontend
```

## 验证部署

### 1. 检查容器状态

```bash
docker ps | grep blog-frontend
```

应该显示容器正在运行。

### 2. 检查容器日志

```bash
docker logs blog-frontend --tail 50
```

应该没有 SSL 相关错误。

### 3. 测试 HTTPS 访问

```bash
# 测试 HTTPS
curl -I https://fbranch.top

# 测试 HTTP 重定向
curl -I http://fbranch.top
```

### 4. 浏览器测试

访问 `https://fbranch.top`，应该：
- 显示绿色安全锁图标
- 证书信息正确
- 页面正常加载

## 常见问题

### Q1: 证书文件权限错误

**错误**：Permission denied

**解决**：
```bash
sudo chmod 644 /opt/ssl/fbranch.top.pem
sudo chmod 600 /opt/ssl/fbranch.top.key
```

### Q2: 容器内看不到证书文件

**原因**：挂载路径不正确或文件不存在

**解决**：
```bash
# 检查宿主机文件
ls -l /opt/ssl/

# 重启容器
docker-compose restart frontend

# 检查容器内
docker exec blog-frontend ls -l /etc/nginx/ssl/
```

### Q3: Let's Encrypt 验证失败

**错误**：Challenge failed

**原因**：80 端口被占用或防火墙阻止

**解决**：
```bash
# 停止占用 80 端口的服务
docker-compose stop frontend

# 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 重新获取证书
sudo certbot certonly --standalone -d fbranch.top -d www.fbranch.top
```

### Q4: 证书域名不匹配

**错误**：Certificate doesn't match domain

**解决**：确保证书包含您的域名
```bash
openssl x509 -in /opt/ssl/fbranch.top.pem -text -noout | grep DNS
```

应该显示：
```
DNS:fbranch.top, DNS:www.fbranch.top
```

## 完整操作命令（快速复制）

```bash
# 1. 停止前端容器
cd /opt/blog/blog-demo
docker-compose stop frontend

# 2. 获取 Let's Encrypt 证书
sudo certbot certonly --standalone -d fbranch.top -d www.fbranch.top

# 3. 创建目录并复制证书
sudo mkdir -p /opt/ssl
sudo cp /etc/letsencrypt/live/fbranch.top/fullchain.pem /opt/ssl/fbranch.top.pem
sudo cp /etc/letsencrypt/live/fbranch.top/privkey.pem /opt/ssl/fbranch.top.key
sudo chmod 644 /opt/ssl/fbranch.top.pem
sudo chmod 600 /opt/ssl/fbranch.top.key

# 4. 重启容器
docker-compose up -d frontend

# 5. 检查日志
docker logs blog-frontend --tail 50

# 6. 测试访问
curl -I https://fbranch.top
```

## 相关文档

- [SSL-SETUP-GUIDE.md](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/SSL-SETUP-GUIDE.md) - 完整的 SSL 配置指南
- [diagnose-ssl.sh](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/diagnose-ssl.sh) - SSL 诊断脚本
