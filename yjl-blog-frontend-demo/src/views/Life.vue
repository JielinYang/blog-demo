<template>
  <div class="life-container" ref="container">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Loading memories...</p>
      </div>
    </div>

    <!-- UI Overlay -->
    <div class="ui-overlay">
      <button v-if="isAdmin" class="add-btn" @click="showAddModal = true">
        <el-icon><Plus /></el-icon> 添加记忆碎片
      </button>
    </div>

    <!-- Hover Tooltip -->
    <div
      v-if="hoveredMemory"
      class="hover-tooltip"
      :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }"
    >
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="time">{{ hoveredMemory.time }}</span>
          <span class="weather">{{ hoveredMemory.weather }}</span>
        </div>
        <div class="mood-tag">{{ hoveredMemory.mood }}</div>
        <div class="text-preview">{{ hoveredMemory.content }}</div>
        <img v-if="hoveredMemory.image" :src="hoveredMemory.image" class="tooltip-img" />
      </div>
    </div>

    <!-- Add Memory Modal -->
    <el-dialog
      v-model="showAddModal"
      title="添加一块记忆碎片"
      width="500px"
      custom-class="glass-modal"
    >
      <el-form :model="newMemory" label-width="80px">
        <el-form-item label="时间">
          <el-date-picker
            v-model="newMemory.time"
            type="datetime"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="天气">
          <el-select v-model="newMemory.weather" placeholder="选择天气" style="width: 100%">
            <el-option label="晴" value="Sunny" />
            <el-option label="雨" value="Rainy" />
            <el-option label="云" value="Cloudy" />
            <el-option label="雪" value="Snowy" />
          </el-select>
        </el-form-item>
        <el-form-item label="心情">
          <el-select v-model="newMemory.mood" placeholder="选择心情" style="width: 100%">
            <el-option label="开心" value="Happy" />
            <el-option label="平静" value="Calm" />
            <el-option label="悲伤" value="Sad" />
            <el-option label="兴奋" value="Excited" />
            <el-option label="焦虑" value="Anxious" />
            <el-option label="失落" value="Lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="newMemory.content"
            type="textarea"
            rows="3"
            placeholder="今天发生了什么？"
          />
        </el-form-item>
        <!-- Image upload placeholder -->
        <el-form-item label="图片">
          <el-input v-model="newMemory.image" placeholder="图片URL（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddModal = false">取消</el-button>
          <el-button type="primary" @click="addMemory">添加</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Memory Detail Modal (Click) -->
    <el-dialog
      v-model="showDetailModal"
      :title="currentMemory?.time"
      width="400px"
      custom-class="glass-modal"
    >
      <div v-if="currentMemory" class="memory-detail">
        <div class="tags">
          <el-tag size="small" effect="dark">{{ currentMemory.weather }}</el-tag>
          <el-tag size="small" effect="dark" type="success">{{ currentMemory.mood }}</el-tag>
        </div>
        <div class="content">{{ currentMemory.content }}</div>
        <img v-if="currentMemory.image" :src="currentMemory.image" class="memory-img" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import * as THREE from 'three'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getLifeFragments, createLifeFragment, type LifeFragment } from '@/apis/lifeApi'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 检查是否为管理员
const isAdmin = computed(() => authStore.isAdmin)

// --- Types ---
interface Memory {
  id: number
  time: string
  weather: string
  mood: string
  content: string
  image?: string
  position?: THREE.Vector3
}

// --- State ---
const container = ref<HTMLElement | null>(null)
const showAddModal = ref(false)
const showDetailModal = ref(false)
const currentMemory = ref<Memory | null>(null)
const hoveredMemory = ref<Memory | null>(null)
const tooltipPosition = reactive({ x: 0, y: 0 })
const loading = ref(true)

const newMemory = reactive({
  time: '',
  weather: '',
  mood: '',
  content: '',
  image: '',
})

// 从后端获取的数据
const memories = ref<Memory[]>([])

// --- Three.js Variables ---
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particles: THREE.Group
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let animationId: number

// --- API Methods ---

// 加载所有生活碎片
const loadFragments = async () => {
  try {
    loading.value = true
    const response: any = await getLifeFragments()

    console.log('API Response:', response) // Debug log

    // 后端返回格式: { success: true, message: "Success", data: [...] }
    if (response.success && response.data) {
      // 将后端数据转换为前端格式
      memories.value = response.data.map((item: any) => ({
        id: item.id,
        time: item.recordTime, // 后端字段: recordTime
        weather: item.weather,
        mood: item.mood,
        content: item.content,
        image: item.imageUrl, // 后端字段: imageUrl
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
        ),
      }))

      console.log('Loaded memories:', memories.value.length) // Debug log

      // 如果已经初始化了Three.js场景，重新创建粒子
      if (particles) {
        scene.remove(particles)
        createParticles()
      }
    } else {
      console.error('Invalid response format:', response)
      ElMessage.error('数据格式错误')
    }
  } catch (error) {
    console.error('Failed to load fragments:', error)
    ElMessage.error('加载生活碎片失败')
  } finally {
    loading.value = false
  }
}

// --- Methods ---

const initThree = () => {
  if (!container.value) return

  // Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050510, 0.002) // Deep space fog

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 50

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // Particles (Nebula)
  createParticles()

  // Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Events
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('click', onMouseClick)

  animate()
}

const createParticles = () => {
  particles = new THREE.Group()

  const MIN_PARTICLES = 40 // 最小粒子数量

  // 创建彩色发光纹理（用于真实记忆）
  const createColorfulTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.2, 'rgba(255, 200, 200, 0.8)')
      gradient.addColorStop(0.5, 'rgba(100, 100, 255, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, 32, 32)
    }
    return new THREE.CanvasTexture(canvas)
  }

  // 创建纯白发光纹理（用于空粒子）
  const createWhiteTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)')
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, 32, 32)
    }
    return new THREE.CanvasTexture(canvas)
  }

  const colorfulTexture = createColorfulTexture()
  const whiteTexture = createWhiteTexture()

  const colorfulMaterial = new THREE.SpriteMaterial({
    map: colorfulTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  })

  const whiteMaterial = new THREE.SpriteMaterial({
    map: whiteTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.5, // 空粒子稍微透明一些
    blending: THREE.AdditiveBlending,
  })

  // 添加真实的记忆粒子
  memories.value.forEach((memory) => {
    const sprite = new THREE.Sprite(colorfulMaterial)
    // Random position if not set
    const x = memory.position?.x ?? (Math.random() - 0.5) * 80
    const y = memory.position?.y ?? (Math.random() - 0.5) * 80
    const z = memory.position?.z ?? (Math.random() - 0.5) * 80

    sprite.position.set(x, y, z)

    // Scale variation
    const scale = Math.random() * 2 + 1
    sprite.scale.set(scale, scale, 1)

    // Store memory data in userData
    sprite.userData = { id: memory.id, originalScale: scale, isEmpty: false }

    particles.add(sprite)
  })

  // 如果记忆数量少于最小值，添加空白粒子
  const emptyParticlesNeeded = MIN_PARTICLES - memories.value.length
  if (emptyParticlesNeeded > 0) {
    for (let i = 0; i < emptyParticlesNeeded; i++) {
      const sprite = new THREE.Sprite(whiteMaterial)

      // 随机位置
      const x = (Math.random() - 0.5) * 80
      const y = (Math.random() - 0.5) * 80
      const z = (Math.random() - 0.5) * 80
      sprite.position.set(x, y, z)

      // 稍小的尺寸
      const scale = Math.random() * 1.5 + 0.8
      sprite.scale.set(scale, scale, 1)

      // 标记为空粒子
      sprite.userData = { id: null, originalScale: scale, isEmpty: true }

      particles.add(sprite)
    }
  }

  scene.add(particles)
}

const onWindowResize = () => {
  if (!container.value) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

const onMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Update tooltip position to follow mouse with offset
  tooltipPosition.x = event.clientX + 15
  tooltipPosition.y = event.clientY + 15
}

const onMouseClick = () => {
  // Calculate objects intersecting the picking ray
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(particles.children)

  if (intersects.length > 0) {
    const object = intersects[0].object

    // 忽略空粒子
    if (object.userData.isEmpty) {
      return
    }

    const memoryId = object.userData.id
    const memory = memories.value.find((m) => m.id === memoryId)
    if (memory) {
      currentMemory.value = memory
      showDetailModal.value = true
    }
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  // Rotate nebula slowly
  particles.rotation.y += 0.001
  particles.rotation.z += 0.0005

  // Raycasting for hover effect
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(particles.children)

  // Reset all scales
  particles.children.forEach((child: any) => {
    const originalScale = child.userData.originalScale
    child.scale.set(originalScale, originalScale, 1)
    // 空粒子和真实粒子的默认透明度不同
    child.material.opacity = child.userData.isEmpty ? 0.5 : 0.8
  })

  // Highlight hovered
  if (intersects.length > 0) {
    const object = intersects[0].object as THREE.Sprite

    // 只对真实记忆粒子显示交互效果
    if (!object.userData.isEmpty) {
      object.scale.set(object.userData.originalScale * 2, object.userData.originalScale * 2, 1)
      object.material.opacity = 1
      document.body.style.cursor = 'pointer'

      // Update hovered memory
      const memoryId = object.userData.id
      const memory = memories.value.find((m) => m.id === memoryId)
      if (memory) {
        hoveredMemory.value = memory
      }
    } else {
      // 空粒子只有轻微的放大效果
      object.scale.set(object.userData.originalScale * 1.2, object.userData.originalScale * 1.2, 1)
      object.material.opacity = 0.7
      document.body.style.cursor = 'default'
      hoveredMemory.value = null
    }
  } else {
    document.body.style.cursor = 'default'
    hoveredMemory.value = null
  }

  renderer.render(scene, camera)
}

const addMemory = async () => {
  if (!newMemory.content) {
    ElMessage.warning('Please enter some content')
    return
  }

  try {
    // 准备发送给后端的数据（使用后端期望的 camelCase 格式）
    const fragmentData: LifeFragment = {
      content: newMemory.content,
      imageUrl: newMemory.image || '', // 使用 imageUrl
      mood: newMemory.mood || 'Neutral',
      weather: newMemory.weather || 'Unknown',
      recordTime: newMemory.time // 使用 recordTime
        ? new Date(newMemory.time).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' '),
    }

    console.log('Sending data:', fragmentData) // Debug log

    // 调用后端API
    const response: any = await createLifeFragment(fragmentData)

    console.log('Create response:', response) // Debug log

    // 后端返回格式: { success: true, message: "Success", data: {...} }
    if (response.success && response.data) {
      // 将新创建的碎片添加到本地数组
      const newMemoryObj: Memory = {
        id: response.data.id,
        time: response.data.recordTime, // 后端字段: recordTime
        weather: response.data.weather,
        mood: response.data.mood,
        content: response.data.content,
        image: response.data.imageUrl, // 后端字段: imageUrl
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
        ),
      }

      memories.value.push(newMemoryObj)

      // 动态添加粒子到场景
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const context = canvas.getContext('2d')
      if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.2, 'rgba(255, 200, 200, 0.8)')
        gradient.addColorStop(0.5, 'rgba(100, 100, 255, 0.2)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        context.fillStyle = gradient
        context.fillRect(0, 0, 32, 32)
      }
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })

      const sprite = new THREE.Sprite(material)
      sprite.position.copy(newMemoryObj.position!)
      const scale = 2
      sprite.scale.set(scale, scale, 1)
      sprite.userData = { id: newMemoryObj.id, originalScale: scale }
      particles.add(sprite)

      showAddModal.value = false
      ElMessage.success('Memory recorded!')

      // Reset form
      newMemory.content = ''
      newMemory.image = ''
      newMemory.time = ''
      newMemory.weather = ''
      newMemory.mood = ''
    } else {
      ElMessage.error('Failed to record memory')
    }
  } catch (error) {
    console.error('Failed to create fragment:', error)
    ElMessage.error('Failed to record memory')
  }
}

onMounted(async () => {
  // 禁用 body 滚动
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'

  await loadFragments()
  initThree()
})

onBeforeUnmount(() => {
  // 恢复 body 滚动
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''

  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('click', onMouseClick)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.life-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(9, 10, 15, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ui-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  color: white;
  pointer-events: none; /* Let clicks pass through to canvas */
}

.ui-overlay .header {
  margin-bottom: 20px;
}

.ui-overlay h1 {
  font-size: 3rem;
  font-weight: 300;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.ui-overlay p {
  font-size: 1.2rem;
  opacity: 0.8;
}

.add-btn {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 60px;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.hover-tooltip {
  position: fixed;
  z-index: 20;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  color: white;
  pointer-events: none;
  backdrop-filter: blur(5px);
  max-width: 250px;
  transform: translate(0, 0);
}

.tooltip-content .tooltip-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 5px;
}

.tooltip-content .mood-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 5px;
}

.tooltip-content .text-preview {
  font-size: 0.9rem;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tooltip-img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 5px;
}

/* Modal Styles */
:deep(.glass-modal) {
  background: rgba(20, 20, 30, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

:deep(.el-dialog__title) {
  color: white;
}

:deep(.el-dialog__body) {
  color: #ddd;
}

.memory-detail {
  text-align: center;
}

.memory-detail .tags {
  margin-bottom: 15px;
}

.memory-detail .tags .el-tag {
  margin: 0 5px;
}

.memory-detail .content {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.memory-img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
