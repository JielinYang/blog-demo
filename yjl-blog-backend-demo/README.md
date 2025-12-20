# 博客后端 API 服务

基于 Node.js + Express + MySQL 的博客后端 API 服务，提供文章管理、分类管理、文件上传、用户认证等功能。

## 功能特性

- ✅ **文章管理**: 文章的创建、编辑、删除、分页查询
- ✅ **分类管理**: 分类的增删改查功能
- ✅ **文件上传**: 支持单张和多张图片上传，包含文件验证
- ✅ **MinIO 存储**: 集成 MinIO 对象存储服务
- ✅ **安全过滤**: HTML 内容安全过滤，防止 XSS 攻击
- ✅ **文件验证**: 文件类型、大小、完整性验证
- ✅ **接口限流**: 不同接口的访问频率限制
- ✅ **用户认证**: JWT 令牌认证，支持注册登录
- ✅ **权限控制**: 基于角色的访问控制

## 技术栈

- **后端框架**: Node.js + Express
- **数据库**: MySQL + Sequelize ORM
- **认证**: JWT (JSON Web Token)
- **文件上传**: Multer
- **安全**: DOMPurify + JSDOM
- **云存储**: MinIO
- **限流**: express-rate-limit

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置相关参数：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库连接、JWT 密钥、MinIO 配置等。

### 3. 配置数据库

确保 MySQL 服务已启动，然后在 `.env` 中配置数据库连接信息。

### 4. 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 接口文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录（带限流）
- `POST /api/auth/refresh` - 刷新令牌
- `GET /api/auth/me` - 获取用户信息（需认证）
- `PUT /api/auth/me` - 更新用户信息（需认证）

### 文章接口

- `GET /api/articles` - 获取文章列表（公开，带限流）
- `GET /api/articles/:id` - 获取单篇文章（公开，带限流）
- `POST /api/articles` - 创建文章（需管理员权限）
- `DELETE /api/articles/:id` - 删除文章（需管理员权限）

### 分类接口

- `GET /api/categories` - 获取分类列表（公开，带限流）
- `GET /api/categories/:id` - 获取单个分类（公开，带限流）
- `POST /api/categories` - 创建分类（需管理员权限）
- `PUT /api/categories/:id` - 更新分类（需管理员权限）
- `DELETE /api/categories/:id` - 删除分类（需管理员权限）

### 文件上传接口

- `POST /api/upload/image` - 上传单张图片（需认证，带限流）
- `POST /api/upload/images` - 上传多张图片（需认证，带限流）
- `DELETE /api/upload/file/:filename` - 删除文件（需管理员权限）
- `GET /api/upload/files` - 获取文件列表（需管理员权限）

### 文件存储接口

- `POST /api/upload/image` - 上传单张图片（需认证，带限流）
- `POST /api/upload/images` - 上传多张图片（需认证，带限流）
- `DELETE /api/upload/file/:filename` - 删除文件（需管理员权限）
- `GET /api/upload/files` - 获取文件列表（需管理员权限）

### 系统接口

- `GET /health` - 健康检查（不受限流影响）

## 安全特性

1. **内容安全过滤**: 使用 DOMPurify 清理 HTML 内容，防止 XSS 攻击
2. **文件上传验证**: 验证文件类型、大小、完整性和恶意内容
3. **接口限流**: 不同接口设置不同的访问频率限制
4. **JWT 认证**: 基于令牌的用户认证机制
5. **权限控制**: 管理员权限验证，保护敏感操作
6. **密码安全**: 使用 bcryptjs 进行密码加密

## 环境配置

| 变量名           | 说明           | 默认值      |
| ---------------- | -------------- | ----------- |
| NODE_ENV         | 运行环境       | development |
| PORT             | 服务端口       | 3000        |
| MYSQL_HOST       | 数据库主机     | localhost   |
| MYSQL_PORT       | 数据库端口     | 3306        |
| MYSQL_DATABASE   | 数据库名称     | blog_db     |
| MYSQL_USER       | 数据库用户     | root        |
| MYSQL_PASSWORD   | 数据库密码     | -           |
| JWT_SECRET       | JWT 密钥       | -           |
| JWT_EXPIRES_IN   | JWT 过期时间   | 24h         |
| MINIO_ENDPOINT   | MinIO 服务地址 | localhost   |
| MINIO_PORT       | MinIO 服务端口 | 9000        |
| MINIO_ACCESS_KEY | MinIO 访问密钥 | -           |
| MINIO_SECRET_KEY | MinIO 密钥     | -           |
| MINIO_BUCKET     | MinIO 存储桶   | blog-files  |

## 开发建议

1. **数据库初始化**: 服务启动时会自动检查数据库表结构，如果不完整会自动初始化
2. **错误处理**: 统一错误响应格式，便于前端处理
3. **日志记录**: 重要操作都有日志记录，便于问题排查
4. **文件清理**: 上传验证失败的文件会自动清理，避免垃圾文件堆积

## 注意事项

1. 生产环境请修改 JWT 密钥和数据库密码
2. MinIO 配置需要先启动 MinIO 服务并创建存储桶
3. 建议配置 HTTPS 和反向代理（如 Nginx）
4. 定期备份数据库和重要文件

## License

MIT
