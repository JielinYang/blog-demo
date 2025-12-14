<template>
  <div class="register-container">
    <!-- 星空粒子背景 -->
    <div class="stars-container">
      <div
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.x + 'px',
          top: star.y + 'px',
          width: star.size + 'px',
          height: star.size + 'px',
          opacity: star.opacity,
          animationDuration: star.duration + 's',
          animationDelay: star.delay + 's',
        }"
      ></div>
    </div>
    <div class="background-overlay"></div>
    <el-card class="register-card animate__animated animate__fadeInDown">
      <template #header>
        <div class="card-header">
          <h2>创建账户</h2>
          <p class="subtitle">加入我们，开启您的旅程</p>
        </div>
      </template>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="0"
        class="register-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱地址"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="isLoading"
            class="register-button"
            @click="handleRegister"
            round
          >
            注册
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login" class="login-link">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { register } from '@/apis/auth'
import type { RegisterForm } from '@/types/auth'

const router = useRouter()

// 表单引用
const registerFormRef = ref<FormInstance>()

// 加载状态
const isLoading = ref(false)

// 注册表单数据
const registerForm = reactive<RegisterForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user', // 默认为普通用户
})

// 自定义验证规则：确认密码
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        isLoading.value = true

        // 准备注册数据，不包含confirmPassword
        const registerData = {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role,
        }

        // 调用注册API
        const res = (await register(registerData)) as any

        if (res.success) {
          ElMessage.success('注册成功，请登录')
          router.push('/login')
        } else {
          ElMessage.error(res.message || '注册失败')
        }
      } catch (error: any) {
        console.error('注册失败:', error)
        ElMessage.error(error.response?.data?.message || error.message || '注册失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
    }
  })
}

// 星空粒子系统
const stars = ref<
  Array<{
    x: number
    y: number
    size: number
    opacity: number
    duration: number
    delay: number
  }>
>([])

// 创建星空粒子
const createStars = () => {
  const starCount = 150 // 粒子数量
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    const duration = Math.random() * 30 + 20 // 20s - 50s
    newStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, // 0.5px - 2.5px
      opacity: Math.random() * 0.8 + 0.2, // 0.2 - 1.0
      duration: duration,
      delay: -Math.random() * duration, // 负延迟使动画立即处于播放状态
    })
  }

  stars.value = newStars
}

// 窗口大小变化时重新创建粒子
const handleResize = () => {
  createStars()
}

onMounted(() => {
  createStars()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
}

/* 星空粒子容器 */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 单个星星 */
.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: starFloat linear infinite;
}

/* 星星浮动动画 */
@keyframes starFloat {
  0% {
    transform: translateY(100vh) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0;
  }
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

.register-card {
  width: 460px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  z-index: 1;
  padding: 20px;
}

.register-card :deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

.register-card :deep(.el-card__body) {
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

.register-form {
  padding: 0 10px;
}

.register-form :deep(.el-input__wrapper),
.register-form :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  padding: 0 15px;
  transition: all 0.3s ease;
}

.register-form :deep(.el-input__wrapper.is-focus),
.register-form :deep(.el-select__wrapper.is-focused) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.register-form :deep(.el-input__inner) {
  color: #fff;
  height: 45px;
}

.register-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.register-form :deep(.el-input__icon) {
  color: rgba(255, 255, 255, 0.8);
}

.register-button {
  width: 100%;
  margin-top: 10px;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.register-button:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.register-button:active {
  transform: translateY(0);
}

.register-footer {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.login-link {
  color: #fff;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 600;
  position: relative;
}

.login-link::after {
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

.login-link:hover::after {
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
