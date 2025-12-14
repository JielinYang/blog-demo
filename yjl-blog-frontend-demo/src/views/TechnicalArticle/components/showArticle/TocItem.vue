<template>
  <li class="toc-item" :class="`level-${item.level}`">
    <a
      :href="`#${item.anchor}`"
      class="toc-link"
      :class="{ active: activeAnchor === item.anchor }"
      @click.prevent="$emit('click', item.anchor)"
    >
      {{ item.text }}
    </a>
    <ul v-if="item.children && item.children.length > 0" class="toc-children">
      <TocItem
        v-for="(child, index) in item.children"
        :key="index"
        :item="child"
        :active-anchor="activeAnchor"
        @click="$emit('click', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { TocItem as TocItemType } from '@/utils/markdownUtils'

defineProps<{
  item: TocItemType
  activeAnchor: string
}>()

defineEmits<{
  click: [anchor: string]
}>()
</script>

<style scoped>
.toc-item {
  margin: 4px 0;
}

.toc-link {
  display: block;
  padding: 6px 8px;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-link:hover {
  background-color: rgba(66, 153, 225, 0.1);
  color: #2c5282;
}

.toc-link.active {
  background-color: rgba(66, 153, 225, 0.15);
  color: #2c5282;
  font-weight: 500;
}

/* 不同层级的缩进 */
.level-1 .toc-link {
  font-weight: 600;
  font-size: 15px;
}

.level-2 .toc-link {
  padding-left: 16px;
}

.level-3 .toc-link {
  padding-left: 32px;
  font-size: 13px;
}

.level-4 .toc-link {
  padding-left: 48px;
  font-size: 13px;
}

.level-5 .toc-link {
  padding-left: 64px;
  font-size: 12px;
}

.level-6 .toc-link {
  padding-left: 80px;
  font-size: 12px;
}

.toc-children {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
