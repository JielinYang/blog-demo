/**
 * MinIO配置文件
 * 统一管理MinIO相关的配置信息
 */

export interface MinioConfig {
  endpoint: string
  accessKey: string
  secretKey: string
  bucketName: string
  useSSL: boolean
  protocol: string
}

// MinIO配置对象
export const minioConfig: MinioConfig = {
  endpoint: '192.168.101.128:19000',
  accessKey: 'minio',
  secretKey: 'nrzaKwM6HE5z3w4N',
  bucketName: 'blog-images',
  useSSL: false,
  protocol: 'http'
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
    'default_article_cover4.png'
  ]
}

/**
 * 根据文章ID获取默认封面图URL
 * @param articleId 文章ID
 * @returns 默认封面图URL
 */
export const getDefaultCoverImageByArticleId = (articleId: number = 0): string => {
  const defaultImages = getDefaultCoverImages()
  const randomIndex = (articleId % defaultImages.length)
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