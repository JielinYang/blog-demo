/**
 * 配置中心
 * 统一导出所有配置模块
 */

export * from './server'
export * from './minio'
export * from './editor'

/**
 * 验证环境配置是否正确加载
 */
export const validateEnvironmentConfig = (): boolean => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_MINIO_ENDPOINT',
    'VITE_MINIO_ACCESS_KEY',
    'VITE_MINIO_SECRET_KEY',
    'VITE_MINIO_BUCKET',
  ]

  console.log('=== 环境变量调试信息 ===')
  console.log('当前模式:', import.meta.env.MODE)
  console.log('开发环境:', import.meta.env.DEV)
  console.log('生产环境:', import.meta.env.PROD)

  const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName])

  if (missingVars.length > 0) {
    console.warn('❌ 缺少必要的环境变量:', missingVars)
    console.warn('💡 请检查以下可能的问题:')
    console.warn('  1. .env.development 文件是否存在且格式正确')
    console.warn('  2. 文件是否在项目根目录')
    console.warn('  3. 变量名是否以 VITE_ 开头')
    console.warn('  4. 服务器是否已重启')
    return false
  }

  console.log('✅ 环境配置验证通过')
  console.log('📍 当前环境:', import.meta.env.VITE_APP_ENV)
  console.log('🔗 API地址:', import.meta.env.VITE_API_BASE_URL)
  console.log('🗂️ MinIO地址:', import.meta.env.VITE_MINIO_ENDPOINT)

  return true
}

// 在开发环境下延迟验证配置，确保环境变量已加载
if (import.meta.env.DEV) {
  setTimeout(() => {
    validateEnvironmentConfig()
  }, 100)
}
