<template>
  <div class="login-container">
    <div class="background-overlay"></div>
    <el-card class="login-card animate__animated animate__fadeInDown">
      <template #header>
        <div class="card-header">
          <h2>欢迎回来</h2>
          <p class="subtitle">登录您的账户以继续</p>
        </div>
      </template>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        class="login-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="authStore.isLoading"
            class="login-button"
            @click="handleLogin"
            round
          >
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 登录表单数据
const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      const result = await authStore.doLogin(loginForm)

      if (result.success) {
        ElMessage.success('登录成功')
        // 登录成功后返回首页
        router.push('/')
      } else {
        ElMessage.error(result.message || '登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: url('@/assets/img/starry-sky.png') no-repeat center center;
  background-size: cover;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3); /* Darken background slightly */
  z-index: 0;
}

.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  z-index: 1;
  padding: 20px;
}

.login-card :deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.login-card :deep(.el-card__body) {
  padding-top: 10px;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 1px;
}

.subtitle {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.login-form {
  padding: 0 10px;
}

.login-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  padding: 0 15px;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.login-form :deep(.el-input__inner) {
  color: #fff;
  height: 45px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.login-form :deep(.el-input__icon) {
  color: rgba(255, 255, 255, 0.8);
}

.login-button {
  width: 100%;
  margin-top: 10px;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(118, 75, 162, 0.4);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.login-button:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.register-link {
  color: #fff;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 600;
  position: relative;
}

.register-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #fff;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease-out;
}

.register-link:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

/* Add some simple animation classes if animate.css is not available */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate__fadeInDown {
  animation-name: fadeInDown;
  animation-duration: 0.8s;
  animation-fill-mode: both;
}
</style>
