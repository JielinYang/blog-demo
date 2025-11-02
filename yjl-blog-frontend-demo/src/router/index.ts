import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import About from '@/views/About.vue'
import Article from '@/views/TechnicalArticle/index.vue'
import ArticleDetail from '@/views/TechnicalArticle/components/showArticle/ArticleDetail.vue'
import WriteArticle from '@/views/TechnicalArticle/components/WriteArticle.vue'
import HomeIndex from '@/views/Home/index.vue'
import Life from '@/views/Life.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // 如果是从文章详情返回文章列表，并且有保存的滚动位置，则恢复滚动位置
    if (savedPosition) {
      return savedPosition
    }
    // 其他情况滚动到顶部
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'HomeIndex',
      component: HomeIndex,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/article',
      name: 'Article',
      component: Article,
    },
    {
      path: '/article/:id',
      name: 'ArticleDetail',
      component: ArticleDetail,
    },
    {
      path: '/article/write',
      name: 'WriteArticle',
      component: WriteArticle,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/life',
      name: 'Life',
      component: Life,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { guest: true }
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (!authStore.user && authStore.token) {
    await authStore.initAuth()
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
    return
  }
  
  // 已登录用户不能访问登录和注册页面
  if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router
