<template>
  <el-container class="article-container" @click="$emit('click')">
    <el-header>
      <el-text class="article-title">{{ article?.title }}</el-text>
      <div class="article-status" v-if="article?.status !== 1">
        <el-tag :type="getStatusType(article?.status)">{{ getStatusText(article?.status) }}</el-tag>
      </div>
    </el-header>
    <el-main>
      <el-text class="article-summary" v-if="article?.summary" line-clamp="3">
        {{ article?.summary }}
      </el-text>
      <el-text class="article-content" v-else line-clamp="4">
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
  </el-container>
</template>

<script setup lang="ts">
import { Article } from '@/models/Article'
import { User, View, Comment, Clock, Star } from '@element-plus/icons-vue'

defineProps<{
  article?: Article
}>()

defineEmits(['click'])

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

.article-title {
  font-size: 24px;
  font-weight: bold;
  margin-right: 10px;
}

.article-status {
  display: inline-block;
}

.article-summary,
.article-content {
  font-size: 16px;
  line-height: 1.6;
  margin: 10px 0;
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
