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
            {{ getPlainText(article?.description) }}
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
              <el-icon :size="20"><Clock /></el-icon>
              <el-text size="large">{{ formatDate(article?.createTime) }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="20"><View /></el-icon>
              <el-text size="large">{{ article?.views }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="20"><Comment /></el-icon>
              <el-text size="large">{{ article?.commentCount }} </el-text>
            </div>
            <div class="meta-item">
              <el-icon :size="20"><Star /></el-icon>
              <el-text size="large">{{ article?.likeCount }} </el-text>
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
import { extractPlainText } from '@/utils/markdownUtils'

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

const getPlainText = (markdown: string = '') => {
  return extractPlainText(markdown, 200)
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
  height: 220px;
  min-height: 220px;
  max-height: 220px;
  width: 100%;
  max-width: 900px;
  border-radius: 16px;
  margin: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  cursor: pointer;
  overflow: hidden;

  /* 深色玻璃态效果 */
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(30, 30, 40, 0.7);
  }
}

.article-layout {
  display: flex;
  gap: 0;
  align-items: stretch;
  max-width: 100%;
  height: auto;
  min-height: 180px;
}

.cover-image-container {
  flex-shrink: 0;
  width: 260px;
  height: 100%;
  overflow: hidden;
  position: relative;
  padding: 20px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  border-radius: 8px;
}

/* .article-container:hover .cover-image {
  transform: scale(1.05);
} */

/* .article-container:hover .cover-image-container:hover {
  background: rgba(30, 30, 40, 0.7);
} */

.cover-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* background: linear-gradient(135deg, rgba(40, 40, 50, 0.5), rgba(30, 30, 40, 0.7)); */
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.cover-image-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.article-content-container {
  flex: 1;
  min-width: 0;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.article-title {
  font-size: 26px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
}

.article-status {
  display: inline-block;
  margin-left: 12px;
}

.article-description,
.article-content {
  font-size: 14px;
  line-height: 1.8;
  margin: 12px 0;
  max-width: 100%;
  color: rgba(255, 255, 255, 0.65);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  margin-top: 12px;
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-tags .el-tag {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 2px 10px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
}

.meta-item:hover {
  color: rgba(255, 255, 255, 0.8);
}

.meta-item .el-icon {
  opacity: 0.7;
}

.el-header {
  height: auto;
  padding: 0;
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.el-main {
  height: auto;
  padding: 0;
  overflow: hidden;
  flex: 1;
}

.el-footer {
  height: auto;
  padding: 0;
  margin-top: 0;
}
</style>
