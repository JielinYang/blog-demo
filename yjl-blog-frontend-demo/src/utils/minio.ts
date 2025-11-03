import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { minioConfig, getMinioBaseUrl, type MinioConfig } from '@/config/minio'

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
    const response = await request.post('/minio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
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

// 备用方案：如果后端没有提供MinIO上传接口，使用七牛云作为备选
export const uploadToMinioWithFallback = async (file: File): Promise<string> => {
  try {
    return await uploadToMinio(file)
  } catch (error) {
    console.warn('MinIO上传失败，尝试使用七牛云:', error)
    
    // 如果MinIO上传失败，回退到七牛云上传
    const { uploadToQiniu } = await import('./qiniu')
    return await uploadToQiniu(file)
  }
}

// 简化版本：使用FormData直接上传到MinIO（需要CORS配置）
const uploadToMinioDirect = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${randomStr}.${fileExt}`
    
    // 创建XMLHttpRequest
    const xhr = new XMLHttpRequest()
    
    // 构建上传URL
    const uploadUrl = `${getMinioBaseUrl()}/${fileName}`
    
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type)
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(uploadUrl)
      } else {
        reject(new Error(`上传失败: ${xhr.statusText}`))
      }
    }
    
    xhr.onerror = function() {
      reject(new Error('上传过程中发生错误'))
    }
    
    xhr.send(file)
  })
}

// 获取minio配置
export const getMinioConfig = (): MinioConfig => {
  return { ...minioConfig }
}

// 更新minio配置
export const updateMinioConfig = (newConfig: Partial<MinioConfig>) => {
  Object.assign(minioConfig, newConfig)
}