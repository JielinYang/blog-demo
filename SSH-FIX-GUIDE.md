# SSH 认证错误修复指南

## 🔍 问题描述

**错误信息:**
```
2025/12/19 11:38:36 ssh: handshake failed: ssh: unable to authenticate, attempted methods [none], no supported methods remain
```

这个错误表明 GitHub Actions 无法通过 SSH 连接到您的服务器,原因是 SSH 认证失败。

---

## 🎯 解决方案

### 方案 1: 重新生成并配置 SSH 密钥 (推荐)

#### 步骤 1: 在本地生成新的 SSH 密钥对

```bash
# 生成专用于 GitHub Actions 的 SSH 密钥
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 或者使用 RSA 格式 (如果服务器不支持 ed25519)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**重要提示:**
- 按回车键时**不要设置密码** (passphrase),直接留空
- 这会生成两个文件:
  - `github_actions_deploy` (私钥)
  - `github_actions_deploy.pub` (公钥)

#### 步骤 2: 将公钥添加到服务器

```bash
# 方法 1: 使用 ssh-copy-id (推荐)
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub your_user@your_server_ip

# 方法 2: 手动复制
# 2.1 查看公钥内容
cat ~/.ssh/github_actions_deploy.pub

# 2.2 SSH 登录到服务器
ssh your_user@your_server_ip

# 2.3 在服务器上添加公钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "粘贴公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 步骤 3: 验证 SSH 连接

```bash
# 在本地测试 SSH 连接
ssh -i ~/.ssh/github_actions_deploy your_user@your_server_ip

# 如果连接成功,说明密钥配置正确
```

#### 步骤 4: 将私钥添加到 GitHub Secrets

```bash
# 查看私钥内容 (包括开头和结尾的标记)
cat ~/.ssh/github_actions_deploy

# 或者在 Windows PowerShell 中
Get-Content ~/.ssh/github_actions_deploy | Out-String
```

**复制完整的私钥内容,包括:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
... (私钥内容) ...
-----END OPENSSH PRIVATE KEY-----
```

**添加到 GitHub:**
1. 进入 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 找到 `SERVER_SSH_KEY` (如果不存在则新建)
4. 粘贴**完整的私钥内容**
5. 点击 Update secret (或 Add secret)

---

### 方案 2: 检查现有 SSH 密钥格式

如果您已经有 SSH 密钥,可能是格式问题:

#### 检查私钥格式

私钥应该是以下格式之一:

**OpenSSH 格式 (推荐):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAA...
-----END OPENSSH PRIVATE KEY-----
```

**RSA 格式:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----
```

#### 转换密钥格式 (如果需要)

```bash
# 如果您的密钥是 PEM 格式,转换为 OpenSSH 格式
ssh-keygen -p -m PEM -f ~/.ssh/id_rsa

# 或者重新生成 OpenSSH 格式的密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key
```

---

### 方案 3: 检查服务器 SSH 配置

#### 步骤 1: 登录服务器检查 SSH 配置

```bash
# SSH 登录到服务器
ssh your_user@your_server_ip

# 检查 SSH 配置文件
sudo nano /etc/ssh/sshd_config
```

#### 步骤 2: 确保以下配置已启用

```bash
# 允许公钥认证
PubkeyAuthentication yes

# 指定授权密钥文件位置
AuthorizedKeysFile .ssh/authorized_keys

# 可选: 禁用密码认证 (提高安全性)
PasswordAuthentication no

# 允许 root 登录 (如果使用 root 用户)
PermitRootLogin prohibit-password
```

#### 步骤 3: 重启 SSH 服务

```bash
# Ubuntu/Debian
sudo systemctl restart sshd

# 或者
sudo service ssh restart

# CentOS/RHEL
sudo systemctl restart sshd
```

#### 步骤 4: 检查文件权限

```bash
# 检查 .ssh 目录和文件权限
ls -la ~/.ssh/

# 正确的权限应该是:
# drwx------ (700) .ssh/
# -rw------- (600) .ssh/authorized_keys

# 如果权限不正确,修复它们:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 🔧 调试步骤

### 1. 在 GitHub Actions 中添加调试信息

修改 [.github/workflows/deploy.yml](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/.github/workflows/deploy.yml):

```yaml
- name: 部署到服务器
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    debug: true  # 添加调试模式
    script: |
      cd /opt/blog/blog-demo
      # ... 其他命令
```

### 2. 在服务器上查看 SSH 日志

```bash
# 实时查看 SSH 认证日志
sudo tail -f /var/log/auth.log

# 或者在 CentOS/RHEL 上
sudo tail -f /var/log/secure
```

### 3. 测试 SSH 连接的详细输出

```bash
# 在本地使用详细模式测试 SSH 连接
ssh -vvv -i ~/.ssh/github_actions_deploy your_user@your_server_ip
```

---

## ✅ 验证清单

完成以下检查,确保配置正确:

- [ ] **私钥格式正确**: 包含完整的 `-----BEGIN` 和 `-----END` 标记
- [ ] **私钥无密码**: 生成密钥时没有设置 passphrase
- [ ] **公钥已添加到服务器**: 在 `~/.ssh/authorized_keys` 文件中
- [ ] **文件权限正确**: 
  - `.ssh/` 目录权限为 `700`
  - `authorized_keys` 文件权限为 `600`
- [ ] **SSH 配置正确**: `PubkeyAuthentication yes` 已启用
- [ ] **GitHub Secrets 配置完整**:
  - `SERVER_HOST`: 服务器 IP 地址
  - `SERVER_USER`: SSH 用户名 (如 `root` 或 `ubuntu`)
  - `SERVER_SSH_KEY`: 完整的私钥内容
- [ ] **本地测试成功**: 使用相同的私钥可以从本地 SSH 连接到服务器

---

## 🚀 快速修复命令

如果您想快速重新配置,可以依次执行以下命令:

### 在本地执行:

```bash
# 1. 生成新密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy -N ""

# 2. 复制公钥到服务器 (替换 USER 和 SERVER_IP)
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub USER@SERVER_IP

# 3. 测试连接
ssh -i ~/.ssh/github_actions_deploy USER@SERVER_IP "echo 'SSH connection successful!'"

# 4. 查看私钥 (复制到 GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

### 在服务器上执行:

```bash
# 1. 检查并修复权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 2. 检查 SSH 配置
sudo grep -E "PubkeyAuthentication|AuthorizedKeysFile" /etc/ssh/sshd_config

# 3. 如果需要,重启 SSH 服务
sudo systemctl restart sshd
```

---

## 📞 仍然无法解决?

如果按照上述步骤仍然无法解决问题,请提供以下信息:

1. **GitHub Actions 的完整错误日志**
2. **服务器 SSH 日志** (`/var/log/auth.log`)
3. **本地测试 SSH 连接的输出** (`ssh -vvv ...`)
4. **服务器操作系统版本** (`cat /etc/os-release`)
5. **SSH 服务版本** (`ssh -V`)

---

## 📝 相关文档

- [DEPLOYMENT.md](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/DEPLOYMENT.md) - 完整部署文档
- [GITHUB-SECRETS.md](file:///c:/MyFile/Projects/javascript/yjl-blog-demo/GITHUB-SECRETS.md) - GitHub Secrets 配置指南
- [GitHub Actions SSH Action 文档](https://github.com/appleboy/ssh-action)
