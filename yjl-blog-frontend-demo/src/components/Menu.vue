<template>
  <el-menu :default-active="activeIndex" mode="horizontal" :ellipsis="false" @select="handleSelect">
    <el-menu-item>
      <ElementPlus style="width: 3em; height: 3em" />
    </el-menu-item>
    <el-menu-item index="1"
      ><router-link to="/"><el-text>首页</el-text></router-link></el-menu-item
    >
    <el-menu-item index="2"
      ><router-link to="/article"><el-text>技术文章</el-text></router-link></el-menu-item
    >
    <el-menu-item index="3"
      ><router-link to="/life"><el-text>生活小记</el-text></router-link></el-menu-item
    >
    <el-menu-item index="4"
      ><router-link to="/about"><el-text>关于</el-text></router-link></el-menu-item
    >
    <el-menu-item>
      <el-input v-model="input" style="max-width: 400px" placeholder="请输入">
        <template #prepend>
          <Search style="width: 1em; height: 1em" />
        </template>
      </el-input>
    </el-menu-item>
    <el-menu-item style="padding-right: 0.5em">
      <el-switch
        v-model="isDark"
        @change="toggleDark"
        inline-prompt
        style="--el-switch-on-color: #909399; --el-switch-off-color: #409eff"
        active-text="暗黑"
        inactive-text="明亮"
      />
    </el-menu-item>
    <el-menu-item style="padding-left: 0.5em">
      <el-dropdown v-if="authStore.isAuthenticated" @command="handleCommand">
        <div class="avatar-container">
          <el-avatar
            :size="40"
            fit="cover"
            src="http://192.168.101.128:19000/blog-images/default_head2.jpg"
          />
          <!-- <div class="username-tooltip">{{ authStore.user?.username }}</div> -->
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
      <el-button v-else @click="goToLogin" type="primary" size="small">登录</el-button>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { User, Edit, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

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

const handleSelect = (key: string, keyPath: string) => {
  console.log(key, keyPath)
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
watch(() => route.path, () => {
  setActiveIndexFromRoute()
})

const input = ref('')

// 切换暗黑模式
const isDark = useDark()
const toggleDark = useToggle(isDark)

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

.el-menu {
  backdrop-filter: blur(40px);
}

.el-input,
.el-switch,
.el-avatar {
  padding: 0 10px;
}

.el-menu-item .el-text {
  padding: 0 20px;
  font-size: var(--menu-font-size);
}

.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}

.el-menu--horizontal {
  justify-content: space-between;
  background-color: transparent;
}

::v-deep a {
  color: var(--text-color);
  text-decoration: none;
}

/* 头像容器样式 */
.avatar-container {
  position: relative;
  display: inline-block;
}

/* 控制头像框内图片尺寸 */
.avatar-container ::v-deep(.el-avatar img) {
  width: 50px; /* 图片宽度，略小于头像框 */
  height: 50px; /* 图片高度，略小于头像框 */
  object-fit: cover; /* 保持比例覆盖 */
}

/* 用户名提示框样式 */
.username-tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}

/* hover时显示用户名提示框 */
.avatar-container:hover .username-tooltip {
  opacity: 1;
  visibility: visible;
}
</style>
