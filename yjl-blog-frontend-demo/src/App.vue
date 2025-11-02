<script setup lang="ts">
import ParticleEffect from './components/ParticleEffect/ParticleEffect.vue'
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

const mainContent = ref<HTMLElement | null>(null)
const route = useRoute()

// 检测页面内容高度，决定是否显示滚动条
const checkScrollbar = () => {
  nextTick(() => {
    const body = document.body
    const viewportHeight = window.innerHeight

    // 获取页面实际内容高度
    let contentHeight = 0

    // 方法1：尝试获取el-main元素的高度
    if (mainContent.value && mainContent.value.$el) {
      // 如果是Element Plus组件，通过$el获取DOM元素
      contentHeight = mainContent.value.$el.scrollHeight
    } else if (mainContent.value) {
      // 如果是原生元素
      contentHeight = mainContent.value.scrollHeight
    } else {
      // 如果无法获取特定元素，使用document.body的高度
      contentHeight = document.documentElement.scrollHeight
    }

    console.log('=== 滚动条检测开始 ===')
    console.log('内容高度:', contentHeight, 'px')
    console.log('视口高度:', viewportHeight, 'px')
    console.log('是否需要滚动条:', contentHeight > viewportHeight)

    // 如果内容高度超过视口高度，显示滚动条
    if (contentHeight > viewportHeight) {
      body.classList.add('overflow-auto')
      console.log('✅ 显示滚动条 - 内容高度超过视口高度')
    } else {
      body.classList.remove('overflow-auto')
      console.log('❌ 隐藏滚动条 - 内容高度未超过视口高度')
    }

    console.log('=== 滚动条检测结束 ===')
  })
}

onMounted(() => {
  console.log('🚀 App组件已挂载，开始初始化滚动条检测')
  checkScrollbar()
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    console.log('📏 窗口大小变化，重新检测滚动条')
    checkScrollbar()
  })
})

// 监听路由变化，确保在路由切换时检测滚动条
watch(
  () => route.path,
  (newPath, oldPath) => {
    console.log('🔄 路由变化检测到:', oldPath, '→', newPath)
    console.log('开始检测滚动条状态...')

    // 延迟检测，确保新页面内容已加载
    setTimeout(() => {
      checkScrollbar()
    }, 100)
  },
)
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
