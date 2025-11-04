// 新建 src/utils/request.js 文件

import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加认证token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // 处理HTTP错误（比如4xx,5xx错误）
    const authStore = useAuthStore()

    if (error.response && error.response.status === 401) {
      // token过期，尝试刷新token
      try {
        const refreshed = await authStore.refreshAccessToken()
        if (refreshed) {
          // 刷新成功，重新发送原请求
          return service.request(error.config)
        } else {
          // 刷新失败，清除认证信息并跳转到登录页
          authStore.clearAuth()
          router.push('/login')
        }
      } catch (refreshError) {
        // 刷新token出错，清除认证信息并跳转到登录页
        authStore.clearAuth()
        router.push('/login')
      }
    }

    let message = ''
    if (error && error.response) {
      switch (error.response.status) {
        case 401:
          message = '认证失败，请重新登录'
          break
        case 403:
          message = '权限不足，无法执行此操作'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = `连接错误 ${error.response.status}`
      }
    } else {
      message = '网络连接不可用，请检查网络'
    }

    // 可以在这里统一显示错误提示
    console.error(message)
    return Promise.reject(error)
  },
)

// 封装通用请求方法
export default {
  get(url: string, params: unknown) {
    return service.get(url, { params })
  },
  post(url: string, data: unknown, config?: any) {
    return service.post(url, data, config)
  },
  put(url: string, data: unknown) {
    return service.put(url, data)
  },
  delete(url: string, params?: unknown) {
    return service.delete(url, { params })
  },
  // 添加一个通用的request方法，支持完整的配置对象
  request(config: any) {
    return service(config)
  },
}
