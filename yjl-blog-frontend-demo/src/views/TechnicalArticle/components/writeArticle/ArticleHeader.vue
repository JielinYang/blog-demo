<template>
  <div class="header-container">
    <el-input
      v-model="title"
      placeholder="请输入文章标题"
      maxlength="100"
      show-word-limit
      clearable
      :disabled="disabled"
    />
    <div class="button-group">
      <el-button @click="emit('save')" :disabled="disabled">保存草稿</el-button>
      <el-button type="primary" @click="emit('publish')" :disabled="disabled">发布文章</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String,
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'publish'])

const title = ref(props.modelValue)

// 监听props.modelValue的变化，确保外部数据更新时组件内部也更新
watch(
  () => props.modelValue,
  (newValue) => {
    title.value = newValue
  },
)

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
