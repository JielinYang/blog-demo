import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getCurrentUser, refreshToken } from '@/apis/auth'
import type { LoginForm } from '@/types/auth'
import router from '@/router'

export interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 初始化用户信息
  const initAuth = async () => {
    if (token.value) {
      try {
        const res: any = await getCurrentUser()
        if (res.success) {
          user.value = res.data
        } else {
          clearAuth()
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        clearAuth()
      }
    }
  }

  // 登录
  const doLogin = async (loginForm: LoginForm) => {
    try {
      isLoading.value = true
      const res: any = await login(loginForm)

      console.log('登录响应:', res)

      if (res.success) {
        const { user: userData, token: accessToken, refreshToken: newRefreshToken } = res.data

        // 保存用户信息和令牌
        user.value = userData
        token.value = accessToken
        refreshTokenValue.value = newRefreshToken

        // 持久化存储
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        return { success: true }
      } else {
        return { success: false, message: res.message || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || '登录失败，请稍后重试',
      }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const doLogout = async () => {
    try {
      if (token.value) {
        await logout()
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    refreshTokenValue.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  // 刷新令牌
  const refreshAccessToken = async () => {
    if (!refreshTokenValue.value) {
      clearAuth()
      return false
    }

    try {
      const res: any = await refreshToken(refreshTokenValue.value)
      if (res.success) {
        token.value = res.data.token
        localStorage.setItem('token', res.data.token)
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      clearAuth()
      return false
    }
  }

  return {
    user,
    token,
    refreshTokenValue,
    isLoading,
    isAuthenticated,
    isAdmin,
    initAuth,
    doLogin,
    doLogout,
    clearAuth,
    refreshAccessToken,
  }
})
