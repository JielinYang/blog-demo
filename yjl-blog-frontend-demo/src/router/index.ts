import { createRouter, createWebHistory } from 'vue-router'
import About from '@/views/About.vue'
import Article from '@/views/TechnicalArticle/index.vue'
import HomeIndex from '@/views/Home/index.vue'
import Life from '@/views/Life.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/life',
      name: 'Life',
      component: Life,
    },
  ],
})

export default router
