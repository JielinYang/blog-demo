<template>
  <div class="header-container">
    <el-input
      v-model="title"
      placeholder="请输入文章标题"
      maxlength="100"
      show-word-limit
      clearable
    />
    <div class="button-group">
      <el-button @click="emit('save')">保存草稿</el-button>
      <el-button type="primary" @click="emit('publish')">发布文章</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue', 'save', 'publish'])

const title = ref(props.modelValue)

watch(title, (val) => emit('update:modelValue', val))
</script>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}
</style>
