<template>
  <div class="quill-editor-container">
    <div ref="editorRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineEmits, defineProps } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { toolbarOptions } from '@/config/editor.ts'
import type Toolbar from 'quill/modules/toolbar'

const props = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: '请输入内容...',
  },
})

const emit = defineEmits(['update:modelValue', 'insert-image'])

const editorRef = ref<HTMLElement>()
let quill: Quill | null = null

onMounted(() => {
  quill = new Quill(editorRef.value!, {
    modules: { toolbar: toolbarOptions },
    placeholder: props.placeholder,
    theme: 'snow',
  })

  quill.on('text-change', () => {
    const content = quill!.root.innerHTML
    emit('update:modelValue', content)
  })

  // 处理图片按钮点击
  const toolbar = quill.getModule('toolbar') as Toolbar
  toolbar.addHandler('image', () => {
    emit('insert-image')
  })
})

// 外部内容同步
watch(
  () => props.modelValue,
  (value) => {
    if (value !== quill?.root.innerHTML) {
      quill?.clipboard.dangerouslyPasteHTML(value || '')
    }
  },
)

// 插入图片方法
const insertImage = (url: string) => {
  if (!quill) {
    console.error('Quill编辑器未初始化')
    return
  }

  // 验证URL有效性
  if (!url || (!url.startsWith('http') && !url.startsWith('data:image'))) {
    console.error('无效的图片URL:', url)
    return
  }

  try {
    const range = quill.getSelection(true) || { index: 0, length: 0 }
    // 使用对象格式插入图片，包含样式控制
    quill.insertEmbed(range.index, 'image', url, 'user')
    quill.setSelection(range.index + 1, 0)
    console.log('RichTextEditor：图片插入成功')
  } catch (error) {
    console.error('RichTextEditor：图片插入失败:', error)
  }
}

defineExpose({ insertImage })
</script>

<style scoped>
/* Quill编辑器容器样式 */
.quill-editor-container {
  border-radius: 4px;
  margin-bottom: 20px;
}

/* 确保Quill编辑器高度合适 */
.quill-editor-container :deep(.ql-container) {
  min-height: 400px;
  max-height: 800px;
  width: 1000px;
  overflow-y: auto;
}

/* 自定义Quill编辑器的一些样式 */
.quill-editor-container :deep(.ql-editor) {
  font-size: 16px;
  line-height: 1.6;

  /* 限制图片最大宽度 */
  img {
    max-width: 100%;
    height: auto;
  }
}
</style>
