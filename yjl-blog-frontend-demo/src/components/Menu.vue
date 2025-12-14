<template>
  <el-menu
    :default-active="activeIndex"
    mode="horizontal"
    :ellipsis="false"
    class="full-width-menu"
  >
    <el-menu-item index="1"
      ><router-link to="/"><el-text>首页</el-text></router-link></el-menu-item
    >
    <el-menu-item index="2"
      ><router-link to="/article"><el-text>文章</el-text></router-link></el-menu-item
    >
    <el-menu-item index="3"
      ><router-link to="/life"><el-text>记忆</el-text></router-link></el-menu-item
    >
    <el-menu-item index="4"
      ><router-link to="/about"><el-text>关于</el-text></router-link></el-menu-item
    >
    <div class="flex-spacer"></div>
    <el-menu-item class="user-menu-item">
      <el-dropdown v-if="authStore.isAuthenticated" @command="handleCommand">
        <div class="avatar-container">
          <el-avatar :size="40" fit="cover" :src="getDefaultCoverImageUrl('default_head2.jpg')" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>{{ authStore.user?.username }}</span>
            </el-dropdown-item>
            <el-dropdown-item command="write" v-if="authStore.isAdmin">
              <el-icon><Edit /></el-icon>
              <span>写文章</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button v-else @click="goToLogin" class="login-btn">登录</el-button>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Edit, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getDefaultCoverImageUrl } from '@/config/minio'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeIndex = ref('1')

// 根据当前路由设置激活的菜单项
const setActiveIndexFromRoute = () => {
  const path = route.path
  if (path === '/') {
    activeIndex.value = '1'
  } else if (path.startsWith('/article')) {
    activeIndex.value = '2'
  } else if (path === '/life') {
    activeIndex.value = '3'
  } else if (path === '/about') {
    activeIndex.value = '4'
  }
}

// 组件挂载时初始化用户信息和路由状态
onMounted(async () => {
  // 如果用户已认证但用户信息为空，重新初始化
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.initAuth()
  }

  // 初始化路由状态
  setActiveIndexFromRoute()
})

// 监听路由变化，更新激活的菜单项
watch(
  () => route.path,
  () => {
    setActiveIndexFromRoute()
  },
)

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // 可以跳转到个人资料页面
      ElMessage.info('个人资料功能待开发')
      break
    case 'write':
      router.push('/article/write')
      break
    case 'logout':
      authStore.doLogout()
      ElMessage.success('已退出登录')
      break
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.full-width-menu {
  width: 100%;
  padding: 0 50px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(20px);
}

.el-menu-item .el-text {
  padding: 0 20px;
  font-size: var(--menu-font-size);
  color: rgba(255, 255, 255, 0.9);
}

.el-menu--horizontal {
  display: flex;
  align-items: center;
  background-color: transparent !important;
}

.el-menu-item {
  background-color: transparent !important;
  border-bottom: none !important;
}

.el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* 用户菜单项（包含登录按钮）悬停时不改变背景色 */
.user-menu-item:hover {
  background-color: transparent !important;
}

/* 激活状态的菜单项 */
.el-menu-item.is-active {
  color: #196dc1 !important;
  border-bottom: 2px solid #196dc1 !important;
}

.el-menu-item.is-active .el-text {
  color: #196dc1 !important;
  font-weight: 600;
}

/* 确保链接在激活状态下也显示正确颜色 */
.el-menu-item.is-active a {
  color: #196dc1 !important;
}

.flex-spacer {
  flex: 1;
}

.user-menu-item {
  margin-left: auto;
}

::v-deep a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
}

::v-deep a:hover {
  color: #fff;
}

/* 头像容器样式 */
.avatar-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

/* 控制头像框内图片尺寸 */
.avatar-container ::v-deep(.el-avatar img) {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

/* 登录按钮样式 */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: none;
}

.login-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}
</style>
