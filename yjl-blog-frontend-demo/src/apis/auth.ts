import request from '@/utils/request'

// 用户注册
export function register(data: {
  username: string
  email: string
  password: string
  role?: string
}) {
  return request.post('/auth/register', data)
}

// 用户登录
export function login(data: {
  username: string
  password: string
}) {
  return request.post('/auth/login', data)
}

// 刷新令牌
export function refreshToken(refreshToken: string) {
  return request.post('/auth/refresh', {
    refreshToken
  })
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/auth/me', {})
}

// 退出登录
export function logout() {
  return request.post('/auth/logout', {})
}