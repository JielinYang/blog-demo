<!-- UnderlineAnimation.vue -->
<template>
  <div @mouseenter="isHovered = true" @mouseleave="isHovered = false" class="animated-text">
    <slot></slot>
    <transition name="underline">
      <div
        v-show="isHovered"
        class="underline"
        :style="{ 'background-color': color, height: thickness }"
      ></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  color: { type: String, default: '#42b883' }, // 下划线颜色
  thickness: { type: String, default: '2px' }, // 下划线粗细
  duration: { type: String, default: '0.3s' }, // 动画时长
})

const isHovered = ref(false)
</script>

<style scoped>
.animated-text {
  position: relative;
  display: inline-block;
}

.underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  transition: all v-bind('props.duration') ease;
}

/* 定义过渡动画 */
.underline-enter-active,
.underline-leave-active {
  transition: opacity v-bind('props.duration') ease;
}
.underline-enter-from,
.underline-leave-to {
  opacity: 0;
  transform: scaleX(0);
}
.underline-enter-to,
.underline-leave-from {
  opacity: 1;
  transform: scaleX(1);
}
</style>
