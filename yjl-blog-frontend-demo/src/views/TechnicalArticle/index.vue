<template>
  <el-container class="article-list-contaier">
    <ArticalBlock v-for="article in articles" :key="article.id" :article="article" />
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getArticles } from '@/apis/articles'
import ArticalBlock from './components/ArticleBlock.vue'
import type { Article } from '@/models/Article'

const articles = ref<Article[]>([])

onMounted(() => {
  getArticles(2, 10).then((res) => {
    articles.value = res.data.data
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
}
</style>
