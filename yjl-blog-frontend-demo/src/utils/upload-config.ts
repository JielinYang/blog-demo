import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadToMinio } from './minio'

// 上传方式枚举（现在只支持MinIO）
export enum UploadMethod {
  MINIO = 'minio',
}

// 当前使用的上传方式（固定为MinIO）
const currentMethod = ref<UploadMethod>(UploadMethod.MINIO)

// 获取当前上传方式
export const getCurrentUploadMethod = (): UploadMethod => {
  return currentMethod.value
}

// 设置上传方式（现在只能设置为MinIO）
export const setUploadMethod = (method: UploadMethod): void => {
  if (method !== UploadMethod.MINIO) {
    ElMessage.warning('目前只支持MinIO上传方式')
    return
  }
  currentMethod.value = method
  ElMessage.success('已切换到MinIO上传方式')
}

// 通用图片上传函数（现在只使用MinIO）
export const uploadImage = async (file: File, directory?: string): Promise<string> => {
  try {
    return await uploadToMinio(file, directory)
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

// 专门用于生活图片的上传函数
export const uploadLifeImage = async (file: File): Promise<string> => {
  const lifeDir = import.meta.env.VITE_MINIO_LIFE_DIR
  return await uploadImage(file, lifeDir)
}

// 获取上传方式配置选项（现在只返回MinIO）
export const getUploadMethodOptions = () => [
  {
    label: 'MinIO',
    value: UploadMethod.MINIO,
    description: '使用MinIO自建对象存储服务',
  },
]

// 导出响应式变量供组件使用
export { currentMethod }
