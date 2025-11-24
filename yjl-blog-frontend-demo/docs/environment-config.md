# 环境配置迁移说明

## 概述
已将MinIO配置信息从硬编码迁移到环境变量文件中，提高了安全性和灵活性。

## 迁移内容

### 1. 环境变量文件
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置
- `.env.example` - 配置示例文件

### 2. MinIO配置项
所有MinIO相关配置现在通过环境变量读取：

```bash
# MinIO服务器地址
VITE_MINIO_ENDPOINT=your-minio-server

# MinIO端口
VITE_MINIO_PORT=9000

# 是否使用SSL
VITE_MINIO_USE_SSL=false

# 访问密钥
VITE_MINIO_ACCESS_KEY=your-access-key

# 密钥
VITE_MINIO_SECRET_KEY=your-secret-key

# 存储桶名称
VITE_MINIO_BUCKET=your-bucket
```

### 3. 代码变更
- `src/config/minio.ts` - 改为从环境变量读取配置
- `src/config/index.ts` - 新增配置验证功能
- `src/main.ts` - 添加环境配置验证

## 使用方法

### 开发环境
1. 复制 `.env.example` 为 `.env.development`
2. 修改配置值为你的开发环境配置
3. 运行 `npm run dev`

### 生产环境
1. 复制 `.env.example` 为 `.env.production`
2. 修改配置值为你的生产环境配置
3. 运行 `npm run build`

## 安全建议

1. **不要将 `.env.production` 提交到代码仓库**
   - 已在 `.gitignore` 中配置
   - 生产环境配置应通过CI/CD或服务器环境变量设置

2. **定期更换访问密钥**
   - 建议每3-6个月更换一次MinIO访问密钥

3. **使用强密码策略**
   - 访问密钥和密钥应使用复杂字符串
   - 避免使用默认或简单密码

## 配置验证

系统启动时会自动验证必要的环境变量是否配置正确，如有缺失会在控制台输出警告信息。

## 故障排查

如果配置不生效：
1. 检查环境变量文件是否存在
2. 检查变量名是否正确（必须以 `VITE_` 开头）
3. 检查配置值是否正确
4. 查看浏览器控制台是否有配置验证警告