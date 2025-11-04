<script setup lang="ts">
import ParticleEffect from './components/ParticleEffect/ParticleEffect.vue'
import Menu from './components/Menu.vue'
import { ref } from 'vue'

const mainContent = ref<HTMLElement | null>(null)
</script>

<template>
  <el-container>
    <el-header><Menu></Menu></el-header>
    <el-main ref="mainContent">
      <router-view></router-view>
    </el-main>
    <el-footer></el-footer>
  </el-container>
  <el-footer></el-footer>
  <ParticleEffect />

  <el-backtop :right="100" :bottom="100" />
</template>

<style>
/* body {
  background-color: red;
} */

/* 使用CSS自定义属性计算滚动条宽度，保持页面宽度稳定 */
:root {
  --scrollbar-width: 17px; /* 大多数浏览器的滚动条宽度 */
}

html {
  /* 只在内容溢出时显示滚动条 */
  overflow-y: auto;
  /* 为滚动条预留空间，保持宽度稳定 */
  width: calc(100vw - var(--scrollbar-width));
  margin-right: var(--scrollbar-width);
}
</style>

<style scoped>
.el-container {
  width: var(--header-length);
  margin: 0 auto;
}

.el-header {
  position: fixed;
  top: 0;
  width: var(--header-length);
  z-index: 1000;
}

.el-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  top: var(--header-height);
  overflow: visible;
  margin-top: 30px;
}

.el-footer {
  height: 300px;
}
</style>
