// 新建 src/utils/request.js 文件

import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 处理HTTP错误（比如4xx,5xx错误）
    let message = ''
    if (error && error.response) {
      switch (error.response.status) {
        case 401:
          message = '认证失败，请重新登录'
          // 这里可以跳转到登录页
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
  post(url: string, data: unknown) {
    return service.post(url, data)
  },
  put(url: string, data: unknown) {
    return service.put(url, data)
  },
  delete(url: string, params: unknown) {
    return service.delete(url, { params })
  },
}
