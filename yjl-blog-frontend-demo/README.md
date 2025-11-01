# yjl-blog-demo

基于Vue3 + TypeScript + Vite构建的个人博客前端项目，已实现文章发布、富文本编辑、分类管理等功能。

## 功能特性

- ✅ 文章发布功能（支持富文本编辑）
- ✅ 多级标题、加粗、倾斜等富文本格式
- ✅ 文章分类管理
- ✅ 标签管理
- ✅ 封面图上传
- ✅ 草稿保存和文章发布
- ✅ 文章列表展示
- ✅ 文章详情页

## 后端API实现提示

### 文章相关API

#### 1. 保存/发布文章

**POST** `/articles/save`

请求体：

```json
{
  "title": "文章标题",
  "content": "文章内容(HTML格式)",
  "tags": ["标签1", "标签2"],
  "category": "技术文章",
  "categoryId": 1,
  "summary": "文章摘要",
  "coverImage": "封面图URL",
  "status": 1 // 0:草稿, 1:已发布, 2:已下线
}
```

#### 2. 获取文章列表

**GET** `/articles?page=1&limit=10`

#### 3. 获取文章详情

**GET** `/articles/{id}`

#### 4. 更新文章

**PUT** `/articles/{id}`

### 分类相关API

#### 获取分类列表

**GET** `/categories`

### 文件上传API

#### 上传文章封面图

**POST** `/articles/upload-cover`

#### 上传文章内容图片

**POST** `/articles/upload-image`

## 数据库设计建议

### 文章表(articles)

```sql
CREATE TABLE articles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL COMMENT '文章标题',
  content LONGTEXT COMMENT '文章内容(HTML格式)',
  author_id BIGINT NOT NULL COMMENT '作者ID',
  author_name VARCHAR(100) COMMENT '作者名称',
  category_id BIGINT COMMENT '分类ID',
  category_name VARCHAR(100) COMMENT '分类名称',
  tags JSON COMMENT '标签数组',
  summary TEXT COMMENT '文章摘要',
  cover_image VARCHAR(500) COMMENT '封面图URL',
  views INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  status TINYINT DEFAULT 0 COMMENT '状态:0草稿,1已发布,2已下线',
  is_top BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 分类表(categories)

```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  article_count INT DEFAULT 0 COMMENT '文章数量',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 后端实现要点

### 1. 文章内容处理

- 接收HTML格式的内容，保留所有富文本格式（多级标题、加粗、倾斜、列表、表格等）
- 需要对HTML内容进行XSS过滤，确保安全性
- 建议存储完整的HTML内容，前端直接渲染

### 2. 文件上传处理

- 图片上传需要限制文件大小（建议2MB以下）
- 支持常见图片格式：jpg, jpeg, png, gif, webp
- 建议生成缩略图，优化加载性能
- 文件命名建议使用UUID，避免中文文件名问题

### 3. 安全性考虑

- 文章内容需要进行HTML过滤，防止XSS攻击
- 文件上传需要验证文件类型和大小
- 建议实现接口限流，防止恶意请求
- 敏感操作需要身份验证

### 4. 富文本格式支持

后端接收的文章内容应该支持以下HTML格式：

```html
<!-- 多级标题 -->
<h1>一级标题</h1>
<h2>二级标题</h2>
<h3>三级标题</h3>

<!-- 文本格式 -->
<p><strong>加粗文本</strong></p>
<p><em>倾斜文本</em></p>
<p><u>下划线文本</u></p>
<p><s>删除线文本</s></p>

<!-- 列表 -->
<ul>
  <li>无序列表项</li>
</ul>
<ol>
  <li>有序列表项</li>
</ol>

<!-- 引用 -->
<blockquote>
  <p>引用内容</p>
</blockquote>

<!-- 代码块 -->
<pre><code>代码内容</code></pre>

<!-- 表格 -->
<table>
  <thead>
    <tr>
      <th>表头1</th>
      <th>表头2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>内容1</td>
      <td>内容2</td>
    </tr>
  </tbody>
</table>

<!-- 图片 -->
<img src="图片URL" alt="图片描述" />

<!-- 链接 -->
<a href="链接URL">链接文本</a>
```

- 记录关键操作日志
- 监控API响应时间和错误率
- 设置告警机制

## 注意事项

1. 前端已配置富文本编辑器Quill，支持多级标题、加粗、倾斜、列表、表格、引用等格式
2. 文章内容以HTML格式存储和传输，后端需要正确处理HTML内容
3. 文件上传功能需要后端配合实现，支持封面图和文章内容图片上传
4. 建议实现文章状态管理（草稿、已发布、已下线）
5. 分类和标签功能需要后端提供相应的数据接口
