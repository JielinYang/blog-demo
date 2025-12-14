<template>
  <div class="table-of-contents">
    <div class="toc-header">
      <span class="toc-title">目录</span>
    </div>
    <div class="toc-content">
      <div v-if="tocItems.length === 0" class="toc-empty">
        <el-text type="info">暂无目录</el-text>
      </div>
      <ul v-else class="toc-list">
        <TocItem
          v-for="(item, index) in tocItems"
          :key="index"
          :item="item"
          :active-anchor="activeAnchor"
          @click="handleTocClick"
        />
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TocItem as TocItemType } from '@/utils/markdownUtils'
import TocItem from './TocItem.vue'

defineProps<{
  tocItems: TocItemType[]
}>()

const activeAnchor = ref('')

// 处理目录点击
const handleTocClick = (anchor: string) => {
  const element = document.getElementById(anchor)
  if (element) {
    // 平滑滚动到目标位置
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // 更新激活状态
    activeAnchor.value = anchor
  }
}

// 监听滚动事件,高亮当前阅读位置
const handleScroll = () => {
  const headings = document.querySelectorAll(
    '.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6',
  )

  let currentAnchor = ''
  headings.forEach((heading) => {
    const rect = heading.getBoundingClientRect()
    if (rect.top <= 100) {
      currentAnchor = heading.id
    }
  })

  if (currentAnchor) {
    activeAnchor.value = currentAnchor
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.table-of-contents {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.toc-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.toc-content {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.toc-empty {
  text-align: center;
  padding: 20px 0;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 自定义滚动条 */
.table-of-contents::-webkit-scrollbar {
  width: 6px;
}

.table-of-contents::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 3px;
}

.table-of-contents::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-dark);
}
</style>
