import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadToQiniu } from './qiniu'
import { uploadToMinio } from './minio'

// 上传方式枚举
export enum UploadMethod {
  QINIU = 'qiniu',
  MINIO = 'minio'
}

// 当前使用的上传方式
const currentMethod = ref<UploadMethod>(UploadMethod.MINIO)

// 获取当前上传方式
export const getCurrentUploadMethod = (): UploadMethod => {
  return currentMethod.value
}

// 设置上传方式
export const setUploadMethod = (method: UploadMethod): void => {
  currentMethod.value = method
  ElMessage.success(`已切换到${method === UploadMethod.QINIU ? '七牛云' : 'MinIO'}上传方式`)
}

// 通用图片上传函数
export const uploadImage = async (file: File): Promise<string> => {
  try {
    let imageUrl: string
    
    switch (currentMethod.value) {
      case UploadMethod.QINIU:
        imageUrl = await uploadToQiniu(file)
        break
      case UploadMethod.MINIO:
        imageUrl = await uploadToMinio(file)
        break
      default:
        throw new Error('未知的上传方式')
    }
    
    return imageUrl
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

// 获取上传方式配置选项
export const getUploadMethodOptions = () => [
  {
    label: '七牛云',
    value: UploadMethod.QINIU,
    description: '使用七牛云对象存储服务'
  },
  {
    label: 'MinIO',
    value: UploadMethod.MINIO,
    description: '使用MinIO自建对象存储服务'
  }
]

// 导出响应式变量供组件使用
export { currentMethod }