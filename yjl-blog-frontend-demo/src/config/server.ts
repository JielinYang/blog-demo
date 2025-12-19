/**
 * 服务器配置文件
 * 统一管理API服务器相关的配置信息
 * 支持开发环境和生产环境的不同配置
 */

export interface ServerConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  environment: 'development' | 'production'
}

// 获取当前环境
const getEnvironment = (): 'development' | 'production' => {
  return import.meta.env.PROD ? 'production' : 'development'
}

// 服务器配置对象
// 根据环境变量或构建时配置来设置不同的值
export const serverConfig: ServerConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  environment: getEnvironment(),
}

/**
 * 获取服务器基础URL
 * @returns 服务器基础URL
 */
export const getServerBaseUrl = (): string => {
  return serverConfig.baseURL
}

/**
 * 更新服务器配置
 * @param newConfig 新的配置对象
 */
export const updateServerConfig = (newConfig: Partial<ServerConfig>): void => {
  Object.assign(serverConfig, newConfig)
}

/**
 * 获取完整的服务器配置
 * @returns 完整的服务器配置对象
 */
export const getServerConfig = (): ServerConfig => {
  return { ...serverConfig }
}
