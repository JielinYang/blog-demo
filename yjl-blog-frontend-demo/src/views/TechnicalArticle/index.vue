<template>
  <el-container class="article-list-contaier">
    <el-button
      class="write-article-btn"
      type="primary"
      @click="goToWriteArticle"
    >
      <el-icon><Edit /></el-icon>
      <span>写文章</span>
    </el-button>

    <!-- 顶部翻页组件 -->
    <el-pagination
      v-if="pagination.total > 0"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      :page-sizes="[6, 10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      :total="pagination.total"
      size="large"
      style="margin: 0 auto"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 无数据状态 -->
    <div v-else-if="articles.length === 0" class="empty-container">
      <el-empty description="暂无文章" />
    </div>

    <!-- 文章列表 -->
    <div v-else>
      <ArticalBlock
        v-for="article in articles"
        :key="article.id"
        :article="article"
        @click="handleArticleClick(article)"
      />
    </div>

    <el-pagination
      v-if="pagination.total > 0"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      :page-sizes="[6, 10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      :total="pagination.total"
      size="large"
      style="margin: 0 auto"
    />
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getArticles } from '@/apis/articles'
import ArticalBlock from './components/showArticle/ArticleBlock.vue'
import type { Article } from '@/models/Article'
import router from '@/router'
import { ElButton, ElSkeleton, ElEmpty } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'

const articles = ref<Article[]>([])
const pagination = ref({
  currentPage: 1,
  pageSize: 6,
  total: 0,
})
const loading = ref(false)

const handleCurrentChange = (newPage: number) => {
  pagination.value.currentPage = newPage
  loading.value = true
  getArticles(newPage, pagination.value.pageSize)
    .then((res) => {
      if (res.data && res.data.articles && res.data.articles.data) {
        articles.value = res.data.articles.data
          .map((item: any) => ({
            id: item.id || 0,
            title: item.title || '无标题',
            content: item.content || '',
            authorId: item.authorId || 0,
            authorName: item.authorName || '匿名作者',
            categoryId: item.categoryId || undefined,
            categoryName: item.categoryName || '未分类',
            tags: item.tags || [],
            summary: item.summary || '',
            coverImage: item.coverUrl || '', // 将coverUrl映射为coverImage
            views: item.views || 0,
            likeCount: item.likeCount || 0,
            commentCount: item.commentCount || 0,
            status: item.status || 1,
            isTop: item.isTop || false,
            createTime: item.createTime || new Date().toISOString(),
            updateTime: item.updateTime || new Date().toISOString(),
          }))
        pagination.value.total = res.data.articles.total
      } else {
        articles.value = []
        pagination.value.total = 0
      }
    })
    .catch((error) => {
      articles.value = []
      pagination.value.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

const handleSizeChange = (newSize: number) => {
  pagination.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置到第一页
  loading.value = true
  getArticles(pagination.value.currentPage, pagination.value.pageSize)
    .then((res) => {
      if (res.data && res.data.articles && res.data.articles.data) {
        articles.value = res.data.articles.data
          .map((item: any) => ({
            id: item.id || 0,
            title: item.title || '无标题',
            content: item.content || '',
            authorId: item.authorId || 0,
            authorName: item.authorName || '匿名作者',
            categoryId: item.categoryId || undefined,
            categoryName: item.categoryName || '未分类',
            tags: item.tags || [],
            summary: item.summary || '',
            coverImage: item.coverUrl || '', // 将coverUrl映射为coverImage
            views: item.views || 0,
            likeCount: item.likeCount || 0,
            commentCount: item.commentCount || 0,
            status: item.status || 1,
            isTop: item.isTop || false,
            createTime: item.createTime || new Date().toISOString(),
            updateTime: item.updateTime || new Date().toISOString(),
          }))
        pagination.value.total = res.data.articles.total
      } else {
        articles.value = []
        pagination.value.total = 0
      }
    })
    .catch((error) => {
      articles.value = []
      pagination.value.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

const handleArticleClick = (article: Article) => {
  // 保存当前页面状态到localStorage
  const state = {
    currentPage: pagination.value.currentPage,
    scrollPosition: window.scrollY,
    isFromArticleDetail: true,
  }
  localStorage.setItem('articleListState', JSON.stringify(state))

  router.push({
    name: 'ArticleDetail',
    params: { id: article.id.toString() },
  })
}

const goToWriteArticle = () => {
  router.push({ name: 'WriteArticle' })
}

onMounted(() => {
  // 检查localStorage中是否有保存的页面状态
  const savedStateStr = localStorage.getItem('articleListState')
  if (savedStateStr) {
    const savedState = JSON.parse(savedStateStr)
    // 只有当有保存的状态时才恢复，避免普通页面加载时也恢复状态
    if (savedState && savedState.currentPage && savedState.isFromArticleDetail) {
      // 恢复页码
      pagination.value.currentPage = savedState.currentPage
      // 延迟恢复滚动位置，等待页面渲染完成
      setTimeout(() => {
        if (savedState.scrollPosition) {
          window.scrollTo(0, savedState.scrollPosition)
        }
        // 清除localStorage中的状态，避免重复恢复
        localStorage.removeItem('articleListState')
      }, 20)
    } else {
      console.log('没有检测到从文章详情返回的状态')
    }
  } else {
    console.log('localStorage中没有保存的状态')
  }

  loading.value = true
  getArticles(pagination.value.currentPage, pagination.value.pageSize)
    .then((res) => {
      if (res.data && res.data.articles && res.data.articles.data) {
        articles.value = res.data.articles.data
          .map((item: any) => ({
            id: item.id || 0,
            title: item.title || '无标题',
            content: item.content || '',
            authorId: item.authorId || 0,
            authorName: item.authorName || '匿名作者',
            categoryId: item.categoryId || undefined,
            categoryName: item.categoryName || '未分类',
            tags: item.tags || [],
            summary: item.summary || '',
            coverImage: item.coverUrl || '', // 将coverUrl映射为coverImage
            views: item.views || 0,
            likeCount: item.likeCount || 0,
            commentCount: item.commentCount || 0,
            status: item.status || 1,
            isTop: item.isTop || false,
            createTime: item.createTime || new Date().toISOString(),
            updateTime: item.updateTime || new Date().toISOString(),
          }))
        pagination.value.total = res.data.articles.total
      } else {
        console.error('数据格式错误:', res.data)
        articles.value = []
        pagination.value.total = 0
      }
    })
    .catch((error) => {
      console.error('获取文章列表失败:', error)
      articles.value = []
      pagination.value.total = 0
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.article-list-contaier {
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 1000px;
  min-height: 500px;
}

.write-article-btn {
  position: fixed;
  bottom: 30px;
  right: 100px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
}

.loading-container {
  padding: 40px 20px;
  width: 100%;
}

.empty-container {
  padding: 60px 20px;
  width: 100%;
}
</style>
