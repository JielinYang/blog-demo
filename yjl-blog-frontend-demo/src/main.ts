import './assets/css/global.css'
import './assets/css/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/theme-chalk/src/message.scss'

// api测试
import { getTest } from './apis/testApi'
getTest()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(ElementPlus, { size: 'large', zIndex: 3000 })
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
