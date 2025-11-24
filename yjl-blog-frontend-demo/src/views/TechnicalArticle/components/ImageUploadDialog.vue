<template>
  <el-dialog v-model="visible" title="插入图片" width="500px" :close-on-click-modal="false">
    <!-- 上传方式信息 -->
    <div class="upload-method-info">
      <el-icon class="info-icon"><InfoFilled /></el-icon>
      <span>当前使用：MinIO自建对象存储服务</span>
    </div>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="上传图片" name="upload">
        <el-upload
          class="image-uploader"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          :disabled="uploading"
        >
          <img v-if="previewUrl" :src="previewUrl" class="preview-image" />
          <div v-else-if="uploading" class="upload-icon">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>{{ uploadProgress }}%</span>
          </div>
          <el-icon v-else class="upload-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">点击上方区域选择图片</div>
        <div class="upload-info">支持JPG、JPEG、PNG、GIF和WEBP格式，大小不超过5MB</div>
      </el-tab-pane>
      <el-tab-pane label="图片URL" name="url">
        <el-input v-model="urlInput" placeholder="请输入图片URL" clearable />
        <div v-if="urlInput" class="url-preview-container">
          <el-image 
            v-if="isValidUrl(urlInput)" 
            :src="urlInput" 
            class="url-preview-image"
            fit="contain"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片预览失败</span>
              </div>
            </template>
          </el-image>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm" :loading="uploading">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading, Picture, InfoFilled } from '@element-plus/icons-vue'
import { checkImageType, checkImageSize } from '@/utils/file.ts'
import { uploadImage } from '@/utils/upload-config'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const activeTab = ref('upload')
const previewUrl = ref('')
const urlInput = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)

const visible = ref(false)

watch(
  () => props.modelValue,
  (val) => (visible.value = val),
)

// 验证URL是否有效
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 图片检查：格式、大小
const handleFileChange = async (uploadFile: { raw: File }) => {
  const file = uploadFile.raw
  if (!checkImageType(file)) {
    ElMessage.error('仅支持JPG、JPEG、PNG、GIF和WEBP格式的图片')
    return
  }

  if (!checkImageSize(file, 5)) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  // 上传前先显示预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  uploading.value = true
  uploadProgress.value = 0

  try {
    // 使用通用上传函数，根据当前选择的上传方式
    const imageUrl = await uploadImage(file)
    previewUrl.value = imageUrl
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('图片上传失败: ' + ((error as Error)?.message || '未知错误'))
    // 失败时清空预览
    previewUrl.value = ''
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const confirm = () => {
  const imageUrl = activeTab.value === 'upload' ? previewUrl.value : urlInput.value

  if (!imageUrl) {
    ElMessage.error('请选择或输入图片')
    return
  }

  emit('confirm', imageUrl)
  close()
}

const cancel = () => close()

const close = () => {
  emit('update:modelValue', false)
  previewUrl.value = ''
  urlInput.value = ''
}
</script>

<style scoped>
/* 上传方式信息 */
.upload-method-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.info-icon {
  margin-right: 8px;
  color: #409eff;
}

.upload-method-info span {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 图片上传相关样式 */
.image-uploader {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* 上传图标 */
.upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.image-uploader.is-disabled .upload-icon {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 上传提示 */
.upload-tip {
  text-align: center;
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

/* 上传信息 */
.upload-info {
  text-align: center;
  margin-top: 5px;
  color: #c0c4cc;
  font-size: 11px;
}

/* URL预览容器 */
.url-preview-container {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

/* URL预览图片 */
.url-preview-image {
  width: 150px;
  height: 150px;
  border-radius: 4px;
}

/* 图片预览 */
.preview-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
}
</style>
