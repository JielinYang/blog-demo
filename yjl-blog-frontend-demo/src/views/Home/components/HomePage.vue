<template>
  <el-container class="top-container">
    <el-space :size="100" alignment="center">
      <el-space direction="vertical" :size="28" style="width: 60rem">
        <el-text style="font-size: 60px"> FBranch's Blog </el-text>
        <el-text style="font-size: 60px"> {{ displayedText }} </el-text>
      </el-space>
      <el-card style="max-width: 480px">
        <template #header>My Introduce</template>
        <img src="@/assets/img/starry-sky.png" style="width: 100%" />
      </el-card>
    </el-space>
  </el-container>
  <el-container class="bottom-container">
    <el-text>下滑查看更多</el-text>
    <el-icon><ArrowDown style="width: 2em; height: 2em" /></el-icon>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
const displayedText = ref('')

onMounted(() => {
  const textToType = '质朴的快乐藏在平淡的生活中'
  let index = 0
  const timeInterval = 100

  function typeText() {
    if (index < textToType.length) {
      displayedText.value += textToType.charAt(index)
      index++
    }
  }

  const typingInterval = setInterval(typeText, timeInterval)

  // 当打字完成后清除定时器
  setTimeout(
    function () {
      clearInterval(typingInterval)
    },
    textToType.length * timeInterval * 5,
  ) // 根据文本长度调整总时间
})
</script>

<style scoped>
.top-container {
  height: 65vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bottom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 30vh;
  width: 100%;
  position: relative;
  top: 10vh;
}

.el-icon {
  animation: move-up-down 1s infinite;
}

@keyframes move-up-down {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
