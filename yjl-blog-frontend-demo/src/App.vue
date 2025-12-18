<script setup lang="ts">
import ParticleEffect from './components/ParticleEffect/ParticleEffect.vue'
import Menu from './components/Menu.vue'
import { ref } from 'vue'

const mainContent = ref<HTMLElement | null>(null)
</script>

<template>
  <el-container>
    <el-header><Menu></Menu></el-header>
    <el-main ref="mainContent" class="main-container">
      <router-view v-slot="{ Component, route }">
        <transition name="fade-slide" mode="out-in">
          <div class="route-wrapper" :key="route.path">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </el-main>
    <!-- <el-footer></el-footer> -->
  </el-container>
  <!-- <el-footer></el-footer> -->
  <ParticleEffect />

  <el-backtop :right="100" :bottom="100" />
</template>

<style>
/* body {
  background-color: red;
} */

/* 路由过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

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
  width: 100%;
  margin: 0;
  padding: 0;
}

.el-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  padding: 0;
  backdrop-filter: blur(2px);
  background: rgba(0, 0, 0, 0.1) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.el-main {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  position: relative;
}

.route-wrapper {
  width: 100%;
}

.el-footer {
  height: 300px;
}
</style>
