<template>
  <div class="article-detail-wrapper">
    <!-- 星空粒子背景 -->
    <div class="stars-container">
      <div
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.x + 'px',
          top: star.y + 'px',
          width: star.size + 'px',
          height: star.size + 'px',
          opacity: star.opacity,
          animationDuration: star.duration + 's',
          animationDelay: star.delay + 's',
        }"
      ></div>
    </div>

    <div class="article-detail">
      <div class="content-container">
        <div class="back-button">
          <el-button @click="goBack" size="large" link>
            <el-icon :size="20"><ArrowLeft /></el-icon>
            <el-text size="large" class="back-text">返回</el-text>
          </el-button>
        </div>
        <!-- 主内容区 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <el-text class="meta-title">{{ article?.title }}</el-text>
              <div class="article-meta">
                <el-text>
                  <el-icon><Clock /></el-icon>{{ formatDate(article?.updateTime) }} 最后修改
                </el-text>
                <el-text>
                  <el-icon><View /></el-icon>{{ article?.views }} 浏览
                </el-text>
                <el-text>
                  <el-icon><ChatDotRound /></el-icon>{{ article?.commentCount }} 评论
                </el-text>
                <el-text>
                  <el-icon><Star /></el-icon>{{ article?.likeCount }} 星标
                </el-text>
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

          <div v-if="article" class="article-content">
            <div v-html="renderedContent" class="markdown-content"></div>
          </div>
          <div v-else class="loading">
            <el-skeleton :rows="10" animated />
          </div>
        </el-card>

        <!-- TOC 侧边栏 -->
        <aside class="toc-sidebar" v-if="tocItems.length > 0">
          <TableOfContents :toc-items="tocItems" />
        </aside>
        <!-- 图片预览组件 -->
        <el-image-viewer
          v-if="showViewer"
          :url-list="previewUrlList"
          :initial-index="initialIndex"
          @close="showViewer = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, View, Clock, Delete, ChatDotRound, Star, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
import { getArticleDetail, deleteArticle as deleteArticleApi } from '@/apis/articles'
import { useAuthStore } from '@/stores/auth'
import { Article } from '@/models/Article'
import { parseMarkdown, extractTOC, addHeadingAnchors } from '@/utils/markdownUtils'
import type { TocItem } from '@/utils/markdownUtils'
import TableOfContents from './TableOfContents.vue'
import 'highlight.js/styles/atom-one-dark.css' // 代码高亮样式

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const articleId = route.params.id as string

const article = ref<Article | null>(null)
const tocItems = ref<TocItem[]>([])

// 图片预览状态
const showViewer = ref(false)
const previewUrlList = ref<string[]>([])
const initialIndex = ref(0)

// 星空粒子系统
const stars = ref<
  Array<{
    x: number
    y: number
    size: number
    opacity: number
    duration: number
    delay: number
  }>
>([])

// 创建星空粒子
const createStars = () => {
  const starCount = 150
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    const duration = Math.random() * 30 + 20
    newStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      duration: duration,
      delay: -Math.random() * duration,
    })
  }

  stars.value = newStars
}

// 窗口大小变化时重新创建粒子
const handleResize = () => {
  createStars()
}

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!article.value?.content) return ''

  // 渲染 Markdown
  const html = parseMarkdown(article.value.content)
  // 添加标题锚点
  return addHeadingAnchors(html)
})

// 返回文章列表
const goBack = () => {
  router.back()
}

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
    article.value = new Article({
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
    })

    // 提取目录结构
    if (article.value.content) {
      tocItems.value = extractTOC(article.value.content)
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

// 处理图片点击
const handleImageClick = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target.tagName === 'IMG' && target.closest('.markdown-content')) {
    const src = target.src
    const index = previewUrlList.value.indexOf(src)
    if (index !== -1) {
      initialIndex.value = index
      showViewer.value = true
    }
  }
}

// 提取所有图片链接
const extractImages = () => {
  const content = document.querySelector('.markdown-content')
  if (content) {
    const images = content.querySelectorAll('img')
    previewUrlList.value = Array.from(images).map((img) => img.src)
    
    // 添加点击事件监听
    content.addEventListener('click', handleImageClick)
  }
}

onMounted(() => {
  // 初始化星空粒子
  createStars()
  window.addEventListener('resize', handleResize)

  fetchArticleDetail().then(() => {
    // 等待 DOM 更新后提取图片
    nextTick(() => {
      extractImages()
    })
  })
  // 页面加载后滚动到顶部
  window.scrollTo(0, 0)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 移除图片点击事件监听
  const content = document.querySelector('.markdown-content')
  if (content) {
    content.removeEventListener('click', handleImageClick)
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.article-detail-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 100px 20px 40px 20px;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
}

/* 星空粒子容器 */
.stars-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 单个星星 */
.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: starFloat linear infinite;
}

/* 星星浮动动画 */
@keyframes starFloat {
  0% {
    transform: translateY(100vh) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0;
  }
}

.article-detail {
  width: 100%;
  max-width: 1400px;
  position: relative;
  z-index: 1;
  margin: 0 auto;
}

.content-container {
  display: flex;
  justify-content: center;
  position: relative;
}

.box-card {
  width: 900px;
  border-radius: 12px;
  background-color: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.toc-sidebar {
  width: 280px;
  position: fixed;
  left: 50%;
  margin-left: 470px; /* 900/2 + 20px gap */
  top: 100px;
  z-index: 10;
}

.toc-sidebar :deep(.table-of-contents) {
  background-color: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

@media (max-width: 1450px) {
  .toc-sidebar {
    display: none;
  }
}

.back-button {
  position: fixed;
  right: 50%;
  margin-right: 550px;
  top: 100px;
  z-index: 10;
}

.back-button :deep(.el-button) {
  color: #e2e8f0;
}

.back-button .el-icon {
  position: absolute;
  left: -10px;
}

.back-text {
  position: absolute;
  top: 6px;
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
  color: #f8fafc;
}

.article-meta {
  color: #94a3b8;
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
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}

.article-content {
  line-height: 1.8;
  color: #e2e8f0;
}

/* Markdown 内容样式 */
.markdown-content {
  line-height: 1.8;
  font-size: 16px;
  color: #e2e8f0;
}

/* Markdown 标题样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 24px 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
  scroll-margin-top: 80px; /* 锚点跳转时的偏移 */
}

.markdown-content :deep(h1) {
  font-size: 2em;
  color: #f8fafc;
  border-bottom: 2px solid #475569;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  color: #f1f5f9;
  border-bottom: 1px solid #475569;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
  color: #e2e8f0;
}

.markdown-content :deep(h4) {
  font-size: 1.125em;
  color: #cbd5e1;
}

.markdown-content :deep(h5) {
  font-size: 1em;
  color: #94a3b8;
}

.markdown-content :deep(h6) {
  font-size: 0.875em;
  color: #64748b;
}

/* Markdown 段落样式 */
.markdown-content :deep(p) {
  margin: 16px 0;
  text-align: justify;
}

/* Markdown 代码样式 */
.markdown-content :deep(code) {
  padding: 2px 6px;
  background-color: #334155;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #f472b6;
  border: 1px solid #475569;
}

.markdown-content :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  background-color: #282c34;
  border-radius: 6px;
  overflow-x: auto;
  position: relative;
  line-height: 1.5;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border: none;
  color: #abb2bf;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* 确保 highlight.js 样式生效 */
.markdown-content :deep(pre.hljs) {
  background-color: #282c34;
  padding: 16px;
}

.markdown-content :deep(pre code.hljs) {
  background-color: transparent;
  color: inherit;
}

/* Markdown 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 16px 0;
  padding-left: 2em;
}

.markdown-content :deep(ul) {
  list-style-type: disc; /* 显示实心圆点 */
}

.markdown-content :deep(ol) {
  list-style-type: decimal; /* 显示数字 */
}

.markdown-content :deep(li) {
  margin: 8px 0;
  line-height: 1.6;
}

.markdown-content :deep(ul ul) {
  list-style-type: circle; /* 二级列表使用空心圆 */
}

.markdown-content :deep(ul ul ul) {
  list-style-type: square; /* 三级列表使用方块 */
}

/* Task List (勾选框) 样式 */
.markdown-content :deep(.task-list-item) {
  list-style-type: none;
  margin-left: -1.5em;
  padding-left: 0;
}

.markdown-content :deep(.task-list-item-checkbox) {
  margin-right: 8px;
  margin-left: 0;
  vertical-align: middle;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.markdown-content :deep(.task-list-item-checkbox[checked]) {
  accent-color: #4299e1;
}

/* Markdown 表格样式 */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 12px 16px;
  border: 1px solid #475569;
  text-align: left;
  color: #fff;
}

.markdown-content :deep(th) {
  background-color: #1e293b;
  font-weight: 600;
  color: #fff;
}

.markdown-content :deep(tr:hover) {
  background-color: #334155;
}

/* Markdown 引用样式 */
.markdown-content :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 4px solid #60a5fa;
  background-color: rgba(30, 41, 59, 0.5);
  color: #94a3b8;
  font-style: italic;
  border-radius: 4px;
}

.markdown-content :deep(blockquote p) {
  margin: 8px 0;
}

.markdown-content :deep(blockquote p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(blockquote blockquote) {
  margin: 12px 0;
  border-left-color: #3b82f6;
  background-color: rgba(30, 41, 59, 0.7);
}

/* Markdown 图片样式 */
.markdown-content :deep(img) {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  height: auto;
  margin: 20px auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  background-color: rgba(255, 255, 255, 0.05);
}

.markdown-content :deep(img:hover) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.markdown-content :deep(p img) {
  margin: 20px auto;
}

/* Markdown 链接样式 */
.markdown-content :deep(a) {
  color: #60a5fa;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.markdown-content :deep(a:hover) {
  border-bottom-color: #60a5fa;
}

/* Markdown 分隔线样式 */
.markdown-content :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 2px solid #475569;
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
