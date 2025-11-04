<template>
  <div class="article-detail">
    <div class="back-button">
      <el-button @click="goBack" size="large" link>
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <el-text class="meta-title">{{ article?.title }}</el-text>
          <div class="article-meta">
            <el-text
              ><el-icon><Clock /></el-icon>{{ formatDate(article?.updateTime) }} 最后修改</el-text
            >
            <el-text
              ><el-icon><View /></el-icon>{{ article?.views }} 浏览</el-text
            >
            <el-text
              ><el-icon><ChatDotRound /></el-icon>{{ article?.commentCount }} 评论</el-text
            >
            <el-text
              ><el-icon><Star /></el-icon>{{ article?.likeCount }} 星标</el-text
            >
          </div>
          <div class="article-actions" v-if="authStore.isAdmin">
            <el-button type="primary" size="small" @click="editArticle">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteArticle">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </div>
      </template>
      <div class="article-content" v-if="article">
        <el-text>
          <div v-html="article.content" class="rich-text-content"></div>
        </el-text>
      </div>
      <div v-else class="loading">
        <el-skeleton :rows="10" animated />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  User,
  View,
  Clock,
  Picture,
  Loading,
  Edit,
  Delete,
  ChatDotRound,
  Star,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getArticleDetail, deleteArticle as deleteArticleApi } from '@/apis/articles'
import { useAuthStore } from '@/stores/auth'
import type { Article } from '@/models/Article'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const articleId = route.params.id as string

// 返回文章列表
const goBack = () => {
  router.back()
}

const article = ref<Article | null>(null)

// 直接使用v-html渲染富文本内容，无需额外的分块处理

// 获取文章详情
const fetchArticleDetail = async () => {
  try {
    const response = await getArticleDetail(articleId)

    // 检查响应数据是否存在
    if (!response) {
      throw new Error('文章数据为空')
    }

    // 根据后端响应结构，数据在response.data中
    const responseData = response.data

    if (!responseData) {
      throw new Error('文章数据为空')
    }

    // 数据适配，处理字段映射 - 根据后端实际返回的字段进行适配
    article.value = {
      id: responseData.id || 0,
      title: responseData.title || '无标题',
      content: responseData.content || '',
      authorId: responseData.authorId || 0, // 后端可能没有返回这个字段
      authorName: responseData.authorName || '匿名作者', // 后端可能没有返回这个字段
      categoryId: responseData.categoryId || undefined, // 后端可能没有返回这个字段
      categoryName: responseData.categoryName || '未分类', // 后端可能没有返回这个字段
      tags: responseData.tags || [], // 后端可能没有返回这个字段
      description: responseData.description || '',
      coverUrl: responseData.coverUrl || '',
      views: responseData.views || 0,
      likeCount: responseData.likeCount || 0,
      commentCount: responseData.commentCount || 0,
      status: responseData.status || 1,
      isTop: responseData.is_top || false, // 后端返回的是is_top字段
      createTime: responseData.createTime || new Date().toISOString(),
      updateTime: responseData.updateTime || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching article detail:', error)
    ElMessage.error('获取文章详情失败')
    // 如果获取文章详情失败，跳转回文章列表
    router.push('/article')
  }
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知时间'

  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '时间格式错误'
  }
}

// 编辑文章
const editArticle = () => {
  router.push(`/article/write?id=${articleId}`)
}

// 删除文章
const deleteArticle = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteArticleApi(Number(articleId))
    ElMessage.success('文章删除成功')
    router.push('/article')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error(error.response?.data?.message || '删除文章失败')
    }
  }
}

onMounted(() => {
  fetchArticleDetail()
  // 页面加载后滚动到顶部
  window.scrollTo(0, 0)
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 使用深度选择器来影响v-html中的内容 */
:deep(.rich-text-content) img {
  max-width: 400px;
  max-height: 400px;
  width: auto;
  height: auto;
  margin: 20px auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
}

.article-detail {
  width: 1000px;
  margin: 50px auto 20px auto;
  padding: 0 20px;
  position: relative;
}

.back-button {
  position: absolute;
  left: 20px;
  top: -50px;
  z-index: 1;
}

.box-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.article-meta {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.article-meta .el-icon {
  margin-right: 5px;
}

.article-actions {
  display: flex;
  gap: 8px;
  align-self: flex-end;
}

.meta-title {
  font-size: 24px;
  font-weight: bold;
}

.article-content {
  line-height: 1.8;
  color: #333;
}

.content-image {
  max-width: 100%;
  margin: 20px 0;
  border-radius: 8px;
  cursor: zoom-in;
}

.content-text {
  margin: 16px 0;
  text-align: justify;
}

/* 富文本内容样式 */
.rich-text-content {
  line-height: 1.8;
  font-size: 16px;
}

/* 富文本中的标题样式 */
.rich-text-content h1,
.rich-text-content h2,
.rich-text-content h3,
.rich-text-content h4,
.rich-text-content h5,
.rich-text-content h6 {
  margin: 24px 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
}

.rich-text-content h1 {
  font-size: 2em;
  color: #1a1a1a;
}
.rich-text-content h2 {
  font-size: 1.5em;
  color: #2c3e50;
}
.rich-text-content h3 {
  font-size: 1.25em;
  color: #34495e;
}
.rich-text-content h4 {
  font-size: 1.125em;
  color: #4a5568;
}
.rich-text-content h5 {
  font-size: 1em;
  color: #718096;
}
.rich-text-content h6 {
  font-size: 0.875em;
  color: #a0aec0;
}

/* 富文本中的段落样式 */
.rich-text-content p {
  margin: 16px 0;
  text-align: justify;
  text-indent: 2em;
}

/* 富文本中的列表样式 */
.rich-text-content ul,
.rich-text-content ol {
  margin: 16px 0;
  padding-left: 2em;
}

.rich-text-content li {
  margin: 8px 0;
}

/* 富文本中的表格样式 */
.rich-text-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.rich-text-content th,
.rich-text-content td {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.rich-text-content th {
  background-color: #f7fafc;
  font-weight: 600;
}

/* 富文本中的引用样式 */
.rich-text-content blockquote {
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 4px solid #4299e1;
  background-color: #f7fafc;
  color: #4a5568;
  font-style: italic;
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
  border-radius: 4px;
}

.image-placeholder .el-icon,
.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.el-image {
  --el-image-placeholder-bg-color: transparent;
}

.loading {
  padding: 20px;
}
</style>
