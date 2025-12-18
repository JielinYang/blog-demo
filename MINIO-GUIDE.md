# MinIO 对象存储使用指南

## 📦 MinIO 简介

MinIO 已集成到 Docker Compose 中,作为博客系统的对象存储服务,用于存储图片、文件等静态资源。

---

## 🚀 快速开始

### 启动 MinIO 服务

MinIO 会随 docker-compose 自动启动:

```bash
# 启动所有服务(包括 MinIO)
docker-compose up -d

# 仅启动 MinIO
docker-compose up -d minio
```

### 访问 MinIO 控制台

启动后,可以通过以下地址访问:

- **API 端口**: `http://your-server-ip:9000`
- **Web 控制台**: `http://your-server-ip:9001`

**默认登录凭证:**
- 用户名: `minioadmin`
- 密码: `minioadmin`

> [!WARNING]
> **生产环境必须修改默认密码!**
> 在 `.env` 文件中设置 `MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY`

---

## ⚙️ 配置说明

### 环境变量配置

在 `.env` 文件中配置 MinIO:

```env
# MinIO 访问凭证
MINIO_ACCESS_KEY=your_secure_access_key
MINIO_SECRET_KEY=your_secure_secret_key

# 存储桶名称
MINIO_BUCKET=blog-images
```

### Docker Compose 配置

MinIO 服务配置在 `docker-compose.yml` 中:

```yaml
minio:
  image: minio/minio:latest
  container_name: blog-minio
  ports:
    - "9000:9000"  # API 端口
    - "9001:9001"  # Web 控制台端口
  environment:
    MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
    MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
  volumes:
    - minio_data:/data  # 数据持久化
```

---

## 🔧 初始化配置

### 1. 创建存储桶

首次使用需要创建存储桶:

**方法一:通过 Web 控制台**

1. 访问 `http://your-server-ip:9001`
2. 使用凭证登录
3. 点击 "Buckets" → "Create Bucket"
4. 输入桶名称: `blog-images`
5. 点击 "Create Bucket"

**方法二:使用 MinIO Client (mc)**

```bash
# 进入 MinIO 容器
docker exec -it blog-minio sh

# 配置别名
mc alias set local http://localhost:9000 minioadmin minioadmin

# 创建存储桶
mc mb local/blog-images

# 设置公开访问策略(可选)
mc anonymous set download local/blog-images

# 退出容器
exit
```

### 2. 设置访问策略

为了让图片可以公开访问,需要设置存储桶策略:

**通过 Web 控制台:**
1. 选择 `blog-images` 存储桶
2. 点击 "Manage" → "Access Rules"
3. 添加规则: Prefix: `*`, Access: `readonly`

**通过命令行:**
```bash
docker exec -it blog-minio sh
mc anonymous set download local/blog-images
```

---

## 💻 后端集成

### Node.js 代码示例

MinIO 环境变量已自动注入到后端服务:

```javascript
import { Client } from 'minio';

// MinIO 客户端配置
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const bucketName = process.env.MINIO_BUCKET || 'blog-images';

// 上传文件示例
async function uploadFile(file, fileName) {
  try {
    // 确保存储桶存在
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }

    // 上传文件
    await minioClient.putObject(bucketName, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype
    });

    // 返回文件 URL
    const url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;
    return url;
  } catch (error) {
    console.error('MinIO 上传失败:', error);
    throw error;
  }
}

// 获取文件 URL
function getFileUrl(fileName) {
  return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`;
}

// 删除文件
async function deleteFile(fileName) {
  try {
    await minioClient.removeObject(bucketName, fileName);
    return true;
  } catch (error) {
    console.error('MinIO 删除失败:', error);
    throw error;
  }
}

export { uploadFile, getFileUrl, deleteFile };
```

---

## 📊 数据管理

### 查看存储使用情况

```bash
# 查看存储桶列表
docker exec blog-minio mc ls local

# 查看存储桶大小
docker exec blog-minio mc du local/blog-images
```

### 备份数据

```bash
# 备份 MinIO 数据卷
docker run --rm -v blog_minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data

# 恢复数据
docker run --rm -v blog_minio_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/minio-backup-20250101.tar.gz -C /
```

---

## 🔒 安全建议

### 1. 修改默认凭证

在 `.env` 文件中设置强密码:

```env
MINIO_ACCESS_KEY=your_strong_access_key_min_8_chars
MINIO_SECRET_KEY=your_strong_secret_key_min_8_chars
```

### 2. 限制网络访问

如果 MinIO 仅供后端使用,可以不暴露端口:

```yaml
# docker-compose.yml
minio:
  # 注释掉端口映射,仅内部网络访问
  # ports:
  #   - "9000:9000"
  #   - "9001:9001"
```

### 3. 使用 HTTPS

生产环境建议配置 HTTPS:

1. 准备 SSL 证书
2. 挂载证书到容器
3. 修改启动命令

```yaml
minio:
  volumes:
    - minio_data:/data
    - ./certs:/root/.minio/certs
  command: server /data --console-address ":9001" --certs-dir /root/.minio/certs
```

---

## 🐛 常见问题

### Q1: 无法访问 MinIO 控制台?

**检查步骤:**
```bash
# 检查容器状态
docker-compose ps minio

# 查看日志
docker-compose logs minio

# 检查端口占用
netstat -an | grep 9001
```

### Q2: 上传文件失败?

**可能原因:**
- 存储桶不存在 → 先创建存储桶
- 凭证错误 → 检查环境变量
- 网络问题 → 检查容器网络连接

### Q3: 图片无法公开访问?

**解决方案:**
```bash
# 设置存储桶为公开读取
docker exec -it blog-minio sh
mc anonymous set download local/blog-images
```

### Q4: 数据丢失?

MinIO 数据存储在 Docker 卷中,只要卷没有删除,数据就不会丢失:

```bash
# 查看数据卷
docker volume ls | grep minio

# 查看卷详情
docker volume inspect blog_minio_data
```

---

## 📈 监控和维护

### 健康检查

MinIO 配置了健康检查:

```bash
# 查看健康状态
docker inspect blog-minio | grep -A 10 Health
```

### 性能监控

通过 Web 控制台查看:
- 存储使用情况
- 请求统计
- 带宽使用

---

## 🔄 迁移指南

### 从本地文件系统迁移到 MinIO

```javascript
// 迁移脚本示例
import fs from 'fs';
import path from 'path';
import { uploadFile } from './minio-client.js';

async function migrateFiles() {
  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);

    await uploadFile({
      buffer: fileBuffer,
      size: fileStats.size,
      mimetype: 'image/jpeg' // 根据实际情况调整
    }, file);

    console.log(`已迁移: ${file}`);
  }
}

migrateFiles();
```

---

## 📚 参考资源

- [MinIO 官方文档](https://min.io/docs/minio/linux/index.html)
- [MinIO Node.js SDK](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [MinIO 最佳实践](https://min.io/docs/minio/linux/operations/concepts.html)

---

**现在你的博客系统拥有了专业的对象存储服务! 🎉**
