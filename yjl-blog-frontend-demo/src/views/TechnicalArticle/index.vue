<template>
  <div class="universe-container">
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

    <el-container class="out-list-contaier">
      <el-button class="write-article-btn" type="primary" @click="goToWriteArticle">
        <el-icon><Edit /></el-icon>
        <span>写文章</span>
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
      <div v-else class="article-list-contaier">
        <transition-group
          name="staggered-list"
          tag="div"
          class="article-list-wrapper"
          @before-enter="beforeEnter"
          @enter="enter"
          appear
        >
          <ArticalBlock
            v-for="(article, index) in articles"
            :key="article.id"
            :article="article"
            :data-index="index"
            @click="handleArticleClick(article)"
          />
        </transition-group>
      </div>

      <el-pagination
        v-if="pagination.total > 0"
        @current-change="handleCurrentChange"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        layout="prev, pager, next"
        :total="pagination.total"
        size="small"
        class="pagination-component"
      />
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import { getArticles } from '@/apis/articles'
import ArticalBlock from './components/showArticle/ArticleBlock.vue'
import type { Article } from '@/models/Article'
import router from '@/router'
import { ElButton, ElSkeleton, ElEmpty } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'

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

const articles = ref<Article[]>([])
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})
const loading = ref(false)

// 创建星空粒子
const createStars = () => {
  const starCount = 150 // 粒子数量
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    const duration = Math.random() * 30 + 20 // 20s - 50s
    newStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, // 0.5px - 2.5px
      opacity: Math.random() * 0.8 + 0.2, // 0.2 - 1.0
      duration: duration,
      delay: -Math.random() * duration, // 负延迟使动画立即处于播放状态
    })
  }

  stars.value = newStars
}

// 窗口大小变化时重新创建粒子
const handleResize = () => {
  createStars()
}

// 清理函数
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
}

const handleCurrentChange = (newPage: number) => {
  pagination.value.currentPage = newPage
  loading.value = true
  getArticles(newPage, pagination.value.pageSize)
    .then((res) => {
      if (res.data && res.data.articles && res.data.articles.data) {
        articles.value = res.data.articles.data.map((item: Article) => ({
          id: item.id || 0,
          title: item.title || '无标题',
          content: item.content || '',
          authorId: item.authorId || 0,
          authorName: item.authorName || '匿名作者',
          categoryId: item.categoryId || undefined,
          categoryName: item.categoryName || '未分类',
          tags: item.tags || [],
          description: item.description || '',
          coverUrl: item.coverUrl || '',
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
      console.error('获取文章列表失败:', error)
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
  // 初始化星空粒子
  createStars()
  window.addEventListener('resize', handleResize)

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
    }
  }

  loading.value = true
  getArticles(pagination.value.currentPage, pagination.value.pageSize)
    .then((res) => {
      if (res.data && res.data.articles && res.data.articles.data) {
        articles.value = res.data.articles.data.map((item: Article) => ({
          id: item.id || 0,
          title: item.title || '无标题',
          content: item.content || '',
          authorId: item.authorId || 0,
          authorName: item.authorName || '匿名作者',
          categoryId: item.categoryId || undefined,
          categoryName: item.categoryName || '未分类',
          tags: item.tags || [],
          description: item.description || '',
          coverUrl: item.coverUrl || '',
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
  cleanup()
})

onUnmounted(() => {
  cleanup()
})

// 列表动画钩子函数
const beforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = 'translateY(30px)'
}

const enter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  const delay = parseInt(htmlEl.dataset.index || '0') * 100 // 每个项目延迟100ms

  setTimeout(() => {
    htmlEl.style.transition =
      'opacity 0.5s ease, transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)'
    htmlEl.style.opacity = '1'
    htmlEl.style.transform = 'translateY(0)'

    // 动画完成后清除内联样式，避免影响后续交互（如hover效果）
    htmlEl.addEventListener(
      'transitionend',
      () => {
        done()
      },
      { once: true },
    )
  }, delay)
}
</script>

<style scoped>
/* 确保 transition-group 的 wrapper 样式正确 */
.article-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.universe-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
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

/* 内容容器 */
.out-list-contaier {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
  padding-bottom: 40px;
  min-height: 100vh;
  width: 100%;
  gap: 30px;
  position: relative;
  z-index: 1;
}

.article-list-contaier {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;
  max-width: 900px;
  z-index: 100;
}

.write-article-btn {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: none;
}

.write-article-btn:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.loading-container {
  padding: 60px 20px;
  width: 100%;
  max-width: 900px;
}

.empty-container {
  padding: 100px 20px;
  width: 100%;
  max-width: 900px;
}

/* 隐藏滚动条但保持滚动功能 */
.list-out-contaier > div::-webkit-scrollbar {
  display: none;
}

.list-out-contaier > div {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 分页器样式优化 */
.pagination-component {
  flex-shrink: 0;
}

:deep(.el-pagination) {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  width: fit-content;
  height: auto;
}

:deep(.el-pagination button),
:deep(.el-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  padding: 0 8px;
}

:deep(.el-pagination button:hover),
:deep(.el-pagination .el-pager li:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

:deep(.el-pagination .el-pager li.is-active) {
  background: #196dc1;
  color: #fff;
  border-color: #196dc1;
}

:deep(.el-pagination .el-pager) {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
