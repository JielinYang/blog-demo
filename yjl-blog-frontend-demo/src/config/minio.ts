/**
 * MinIO配置文件
 * 统一管理MinIO相关的配置信息
 * 配置信息从环境变量读取，提高安全性
 */

export interface MinioConfig {
  endpoint: string
  accessKey: string
  secretKey: string
  bucketName: string
  useSSL: boolean
  protocol: string
}

// 从环境变量读取MinIO配置
export const minioConfig: MinioConfig = {
  endpoint: import.meta.env.VITE_MINIO_ENDPOINT,
  accessKey: import.meta.env.VITE_MINIO_ACCESS_KEY,
  secretKey: import.meta.env.VITE_MINIO_SECRET_KEY,
  bucketName: import.meta.env.VITE_MINIO_BUCKET,
  useSSL: import.meta.env.VITE_MINIO_USE_SSL === 'true',
  protocol: import.meta.env.VITE_MINIO_PROTOCOL,
}

/**
 * 获取MinIO基础URL
 * @returns MinIO基础URL
 */
export const getMinioBaseUrl = (): string => {
  const { protocol, endpoint, bucketName } = minioConfig
  return `${protocol}://${endpoint}/${bucketName}`
}

/**
 * 获取默认封面图URL
 * @param fileName 文件名
 * @returns 完整的MinIO文件URL
 */
export const getDefaultCoverImageUrl = (fileName: string): string => {
  return `${getMinioBaseUrl()}/${fileName}`
}

/**
 * 获取默认封面图列表
 * @returns 默认封面图文件名列表
 */
export const getDefaultCoverImages = (): string[] => {
  return [
    'default_article_cover1.png',
    'default_article_cover2.png',
    'default_article_cover3.png',
    'default_article_cover4.png',
  ]
}

/**
 * 根据文章ID获取默认封面图URL
 * @param articleId 文章ID
 * @returns 默认封面图URL
 */
export const getDefaultCoverImageByArticleId = (articleId: number = 0): string => {
  const defaultImages = getDefaultCoverImages()
  const randomIndex = articleId % defaultImages.length
  const fileName = defaultImages[randomIndex]
  return getDefaultCoverImageUrl(fileName)
}

/**
 * 更新MinIO配置
 * @param newConfig 新的配置对象
 */
export const updateMinioConfig = (newConfig: Partial<MinioConfig>): void => {
  Object.assign(minioConfig, newConfig)
}

/**
 * 获取完整的MinIO配置
 * @returns 完整的MinIO配置对象
 */
export const getMinioConfig = (): MinioConfig => {
  return { ...minioConfig }
}
