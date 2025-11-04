<template>
  <el-container class="article-container" @click="$emit('click')">
    <div class="article-layout">
      <!-- 封面图片区域 -->
      <div class="cover-image-container">
        <el-image
          class="cover-image"
          :src="getCoverImageUrl(article?.coverUrl)"
          fit="cover"
          :preview-src-list="[getCoverImageUrl(article?.coverUrl)]"
        >
          <template #error>
            <div class="cover-image-placeholder">
              <el-icon><Picture /></el-icon>
              <span>无封面图</span>
            </div>
          </template>
        </el-image>
      </div>

      <!-- 文章内容区域 -->
      <div class="article-content-container">
        <el-header>
          <el-text class="article-title" line-clamp="1">{{ article?.title }}</el-text>
          <div class="article-status" v-if="article?.status !== 1">
            <el-tag :type="getStatusType(article?.status)">{{
              getStatusText(article?.status)
            }}</el-tag>
          </div>
        </el-header>
        <el-main>
          <el-text class="article-description" v-if="article?.description" line-clamp="3">
            {{ article?.description }}
          </el-text>
          <el-text class="article-content" v-else line-clamp="3">
            {{ getPlainText(article?.content) }}
          </el-text>
          <div class="article-tags" v-if="article?.tags && article.tags.length > 0">
            <el-tag
              v-for="tag in article.tags.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-main>
        <el-footer>
          <div class="article-meta">
            <div class="meta-item">
              <el-icon :size="16"><Clock /></el-icon>
              <el-text size="small">{{ formatDate(article?.createTime) }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="16"><View /></el-icon>
              <el-text size="small">{{ article?.views }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="16"><Comment /></el-icon>
              <el-text size="small">{{ article?.commentCount }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="16"><Star /></el-icon>
              <el-text size="small">{{ article?.likeCount }} </el-text>
            </div>
          </div>
        </el-footer>
      </div>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { Article } from '@/models/Article'
import { View, Comment, Clock, Star, Picture } from '@element-plus/icons-vue'
import { getDefaultCoverImageByArticleId } from '@/config/minio'

const props = defineProps<{
  article?: Article
}>()

defineEmits(['click'])

// 获取封面图片URL
const getCoverImageUrl = (coverImage: string = '') => {
  // 如果有自定义封面图，直接返回
  if (coverImage && coverImage.trim() !== '') {
    return coverImage
  }

  // 如果没有封面图，从minio数据库中随机选择一张默认封面图
  // 使用文章ID作为随机种子，确保同一篇文章每次显示相同的默认封面
  const articleId = props.article?.id || 0
  return getDefaultCoverImageByArticleId(articleId)
}

const getPlainText = (html: string = '') => {
  return html.replace(/<[^>]*>/g, '')
}

const formatDate = (dateString: string = '') => {
  if (!dateString) return '未知日期'

  try {
    const date = new Date(dateString)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期'
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '日期错误'
  }
}

const getStatusText = (status: number = 0) => {
  const statusMap = {
    0: '草稿',
    1: '已发布',
    2: '已下线',
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

const getStatusType = (status: number = 0) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger',
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.article-container {
  width: 1000px;
  border-radius: 12px;
  margin: 20px auto;
  transition: all 0.3s ease-in-out;
  padding: 20px;
  cursor: pointer;
  backdrop-filter: blur(10px);

  /* 使用Element Plus变量设置样式 */
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-darker);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px var(--el-box-shadow-light);
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
  }
}

.article-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  max-width: 100%;
}

.cover-image-container {
  flex-shrink: 0;
  width: 200px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.cover-image-placeholder .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.article-content-container {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 24px;
  font-weight: bold;
  flex: 1;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-status {
  display: inline-block;
}

.article-description,
.article-content {
  font-size: 16px;
  line-height: 1.6;
  margin: 10px 0;
  max-width: 100%;
}

.article-tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #999;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.el-header {
  height: auto;
  padding: 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.el-main {
  height: auto;
  padding: 0;
  overflow: hidden;
}

.el-footer {
  height: auto;
  padding: 0;
  margin-top: 15px;
}
</style>
