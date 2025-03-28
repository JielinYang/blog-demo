<template>
  <el-container class="layout-container">
    <!-- 上区域 -->
    <el-header class="header">上区域（20%）</el-header>

    <!-- 中间区域 -->
    <el-main class="middle-container">
      <el-row class="middle-content" :gutter="0">
        <!-- 左区域（30%） -->
        <el-col :span="7" class="left"> 左区域（30%） </el-col>
        <!-- 右区域（70%） -->
        <el-col :span="17" class="right"> 右区域（70%） </el-col>
      </el-row>
    </el-main>

    <!-- 下区域 -->
    <el-footer class="footer">下区域（20%）</el-footer>
  </el-container>
</template>

<script setup lang="ts">
// 无需额外逻辑，直接通过样式控制布局
</script>

<style scoped>
/* 全局样式 */
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

.layout-container {
  width: 80%; /* 宽度占视口80% */
  margin: 0 auto; /* 水平居中 */
  height: 100vh; /* 高度占满屏幕 */
}

/* 上、中、下区域的样式 */
.header,
.middle-container,
.footer {
  padding: 0;
}

.header {
  height: 20% !important; /* 强制覆盖默认高度 */
  background-color: #f0f0f0;
}

.middle-container {
  height: 60% !important; /* 中间区域占60% */
  background-color: #e0e0e0;
}

.footer {
  height: 20% !important; /* 下区域占20% */
  background-color: #d0d0d0;
}

/* 中间区域左右分栏样式 */
.middle-content {
  height: 100%; /* 中间区域内部高度占满 */
}

.left,
.right {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.left {
  background-color: #409eff;
  /* 使用 span 计算宽度（24栅格系统） */
  /* 30% ≈ 24 * 0.3 = 7.2，取整为7 */
}

.right {
  background-color: #67c23a;
  /* 70% ≈ 24 * 0.7 = 16.8，取整为17 */
}
</style>
