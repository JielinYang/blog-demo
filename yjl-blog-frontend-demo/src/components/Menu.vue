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
        <el-avatar :size="40" src="@src/assets/img/ipad.png" />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { User, Edit, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string) => {
  console.log(key, keyPath)
}

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
</style>
