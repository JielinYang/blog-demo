<template>
  <div class="markdown-uploader">
    <!-- 文件上传区域 -->
    <el-upload
      ref="uploadRef"
      class="upload-area"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleFileChange"
      accept=".md"
      :limit="1"
    >
      <el-icon class="upload-icon"><UploadFilled /></el-icon>
      <div class="upload-text">
        <p class="upload-title">拖拽 Markdown 文件到此处</p>
        <p class="upload-hint">或点击选择文件</p>
        <p class="upload-limit">仅支持 .md 格式,文件大小不超过 5MB</p>
      </div>
    </el-upload>

    <!-- 文件信息 -->
    <div v-if="fileInfo" class="file-info">
      <el-icon class="file-icon"><Document /></el-icon>
      <span class="file-name">{{ fileInfo.name }}</span>
      <span class="file-size">({{ formatFileSize(fileInfo.size) }})</span>
      <el-button type="danger" size="small" link @click="clearFile">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- Markdown 预览 -->
    <div v-if="previewHtml" class="markdown-preview">
      <div class="preview-header">
        <span class="preview-title">预览</span>
        <el-button size="small" @click="togglePreview">
          {{ showPreview ? '隐藏预览' : '显示预览' }}
        </el-button>
      </div>
      <div v-show="showPreview" class="preview-content" v-html="previewHtml"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Close } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { parseFrontMatter, parseMarkdown, addHeadingAnchors } from '@/utils/markdownUtils'

const emit = defineEmits<{
  'update:modelValue': [content: string]
  'metadata-parsed': [metadata: any]
}>()

const uploadRef = ref()
const fileInfo = ref<{ name: string; size: number } | null>(null)
const previewHtml = ref('')
const showPreview = ref(true)
const rawContent = ref('')

// 处理文件选择
const handleFileChange = async (file: UploadFile) => {
  // 验证文件类型
  if (!file.name.endsWith('.md')) {
    ElMessage.error('只能上传 .md 格式的文件')
    return
  }

  // 验证文件大小 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size && file.size > maxSize) {
    ElMessage.error('文件大小不能超过 5MB')
    return
  }

  try {
    // 读取文件内容
    const content = await readFileContent(file.raw!)
    rawContent.value = content

    // 解析 Front Matter
    const { data, content: markdownContent } = parseFrontMatter(content)

    // 发送元数据到父组件
    emit('metadata-parsed', data)

    // 发送完整内容到父组件
    emit('update:modelValue', content)

    // 生成预览
    const html = parseMarkdown(markdownContent)
    previewHtml.value = addHeadingAnchors(html)

    // 保存文件信息
    fileInfo.value = {
      name: file.name,
      size: file.size || 0,
    }

    ElMessage.success('文件上传成功')
  } catch (error) {
    ElMessage.error('文件读取失败: ' + (error as Error).message)
    console.error('文件读取失败:', error)
  }
}

// 读取文件内容
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

// 清除文件
const clearFile = () => {
  fileInfo.value = null
  previewHtml.value = ''
  rawContent.value = ''
  emit('update:modelValue', '')
  uploadRef.value?.clearFiles()
}

// 切换预览显示
const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>

<style scoped>
.markdown-uploader {
  width: 100%;
}

.upload-area {
  width: 100%;
  margin-bottom: 20px;
}

:deep(.el-upload-dragger) {
  padding: 40px 20px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.upload-limit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 20px;
}

.file-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.markdown-preview {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.preview-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
  background-color: var(--el-bg-color);
}

/* Markdown 样式 */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid var(--el-border-color);
  padding-bottom: 0.3em;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 0.3em;
}

.preview-content :deep(h3) {
  font-size: 1.25em;
}

.preview-content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.6;
}

.preview-content :deep(code) {
  padding: 2px 6px;
  background-color: var(--el-fill-color);
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.preview-content :deep(pre) {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #282c34;
  border-radius: 6px;
  overflow-x: auto;
}

.preview-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #abb2bf;
}

.preview-content :deep(blockquote) {
  margin: 16px 0;
  padding: 0 16px;
  border-left: 4px solid var(--el-color-primary);
  color: var(--el-text-color-secondary);
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 2em;
}

.preview-content :deep(li) {
  margin-bottom: 4px;
}

.preview-content :deep(table) {
  width: 100%;
  margin-bottom: 16px;
  border-collapse: collapse;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
}

.preview-content :deep(th) {
  background-color: var(--el-fill-color-light);
  font-weight: 600;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.preview-content :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}
</style>
