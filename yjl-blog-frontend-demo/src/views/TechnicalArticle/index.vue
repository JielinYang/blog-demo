<template>
  <el-container class="article-list-contaier">
    <el-button
      class="write-article-btn"
      type="primary"
      icon="el-icon-edit"
      @click="goToWriteArticle"
    >
      写文章
    </el-button>
    
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
      :current-page="pagination.currentPage"
      layout="total, prev, pager, next"
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

const articles = ref<Article[]>([])
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})
const loading = ref(false)

const handleCurrentChange = (newPage: number) => {
  pagination.value.currentPage = newPage
  loading.value = true
  getArticles(newPage, pagination.value.pageSize).then((res) => {
    console.log('文章列表数据:', res.data)
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
          updateTime: item.updateTime || new Date().toISOString()
        }))
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      pagination.value.total = res.data.articles.total
    } else {
      console.error('数据格式错误:', res.data)
      articles.value = []
      pagination.value.total = 0
    }
  }).catch((error) => {
    console.error('获取文章列表失败:', error)
    articles.value = []
    pagination.value.total = 0
  }).finally(() => {
    loading.value = false
  })
}

const handleArticleClick = (article: Article) => {
  router.push({ name: 'ArticleDetail', params: { id: article.id.toString() } })
}

const goToWriteArticle = () => {
  router.push({ name: 'WriteArticle' })
}

onMounted(() => {
  loading.value = true
  getArticles(pagination.value.currentPage, pagination.value.pageSize).then((res) => {
    console.log('文章列表数据:', res.data)
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
          updateTime: item.updateTime || new Date().toISOString()
        }))
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      pagination.value.total = res.data.articles.total
    } else {
      console.error('数据格式错误:', res.data)
      articles.value = []
      pagination.value.total = 0
    }
  }).catch((error) => {
    console.error('获取文章列表失败:', error)
    articles.value = []
    pagination.value.total = 0
  }).finally(() => {
    loading.value = false
  })
})
</script>

<style scoped>
.article-list-contaier {
  display: flex;
  flex-direction: column;
  position: relative;
  top: 50px;
  margin: 0 auto;
  max-width: 1000px;
  min-height: 500px;
}

.write-article-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
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
