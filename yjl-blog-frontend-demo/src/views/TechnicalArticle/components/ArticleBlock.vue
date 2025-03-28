<template>
  <el-container class="article-container">
    <el-header>
      <el-text class="article-title">{{ article?.title }}</el-text>
    </el-header>
    <el-main>
      <el-text class="article-content" line-clamp="4">
        {{ article?.content }}
      </el-text>
    </el-main>
    <el-footer>
      <div>
        <el-icon :size="20"><View /></el-icon>
        <el-text>{{ article?.views }} </el-text>
      </div>
      <div>
        <el-icon :size="20"><Comment /></el-icon>
        <el-text>{{ article?.commentCount }} </el-text>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { Article } from '@/models/Article'

defineProps<{
  article?: Article
}>()
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.article-container {
  width: 1000px;
  /* border: 1px solid #ccc; */
  border-radius: 5px;
  margin: 20px auto;
  transition: all 0.3s ease-in-out;
  padding: 10px;

  &:hover {
    transform: scale(1.05);
    transition: all 0.3s ease-in-out;
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  color: white;
}

.article-content {
  font-size: 18px;
  color: grey;
}

.el-header {
  height: 45px;
}

.el-main {
  height: 100px;
  overflow: hidden;
}

.el-footer {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.el-footer div {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
