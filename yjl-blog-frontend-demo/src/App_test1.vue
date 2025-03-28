<!-- eslint-disable vue/no-parsing-error -->
<template>
  <el-container class="mycontainer">
    <el-container class="top"> </el-container>
    <el-container class="bottom">
      <el-container class="bottom-left"> </el-container>
      <el-container class="bottom-right">
        <el-container class="bottom-right-top"> </el-container>
        <el-container class="bottom-right-bottom"> </el-container>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts"></script>

<style scoped>
.mycontainer {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.top {
  height: 50vh;
  background-color: red;
}

.bottom {
  height: 50vh;
  display: flex;
}

.bottom-left {
  width: 50%;
  background-color: blue;
}

.bottom-right {
  width: 50%;
  display: flex;
  flex-direction: column;
}

.bottom-right-top {
  height: 50%;
  background-color: green;
}

.bottom-right-bottom {
  height: 50%;
  background-color: yellow;
}
</style>
