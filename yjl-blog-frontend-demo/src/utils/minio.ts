import request from '@/utils/request'
import { minioConfig, type MinioConfig } from '@/config/minio'

// 通过后端API上传文件到MinIO
export const uploadToMinio = async (file: File): Promise<string> => {
  try {
    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${randomStr}.${fileExt}`

    // 创建FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', fileName)

    // 调用后端API上传文件
    const response: any = await request.post('/minio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data && response.data.url) {
      return response.data.url
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error) {
    console.error('minio上传失败:', error)
    throw new Error('图片上传失败: ' + ((error as Error)?.message || '未知错误'))
  }
}

// 获取minio配置
export const getMinioConfig = (): MinioConfig => {
  return { ...minioConfig }
}

// 更新minio配置
export const updateMinioConfig = (newConfig: Partial<MinioConfig>) => {
  Object.assign(minioConfig, newConfig)
}
