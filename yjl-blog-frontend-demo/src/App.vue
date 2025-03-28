<script setup lang="ts">
import ParticleEffect from './components/ParticleEffect/ParticleEffect.vue'
</script>

<template>
  <el-container>
    <el-header><Menu></Menu></el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
    <el-footer></el-footer>
  </el-container>
  <el-footer></el-footer>
  <ParticleEffect />

  <el-backtop :right="100" :bottom="100" />
</template>

<!-- <script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import { gsap } from 'gsap'

onMounted(() => {
  containerRef.value = document.body
  document.body.classList.add('particle-container')
  document.body.addEventListener('mousemove', handleMouseMove)
})

// 粒子生成相关动画
const containerRef = ref<HTMLElement | null>(null)
const particles = ref<HTMLDivElement[]>([])
const MAX_PARTICLES = 100
const PARTICLE_LIFETIME = 1.5
let lastGenerateTime = Date.now()
const generateInterval = 100

const getRandomColor = () => `hsl(${Math.random() * 360}, 70%, 50%)`

const getRandomShape = () => {
  const shapes = ['circle', 'square', 'triangle']
  return shapes[Math.floor(Math.random() * shapes.length)]
}

const createParticle = (x: number, y: number) => {
  const particle = document.createElement('div')
  const shape = getRandomShape()
  const size = Math.random() * 4

  particle.className = `particle particle--circle`
  particle.style.backgroundColor = getRandomColor()
  particle.style.width = `${size}px`
  particle.style.height = shape === 'triangle' ? '0' : `${size}px`
  particle.style.borderColor = particle.style.backgroundColor
  particle.style.borderRadius = '50%'
  particle.style.background =
    'radial-gradient(circle at center, #ffcc00 0%, rgba(255, 204, 0, 0.5) 50%, rgba(255, 204, 0, 0) 100%)'
  particle.style.animation = 'pulse 2s infinite' // 引用预定义的动画
  particle.style.position = 'absolute'

  // 显式设置元素的 left 和 top 为 0，确保 transform 的初始位置正确
  particle.style.left = '0px'
  particle.style.top = '0px'

  if (containerRef.value) {
    containerRef.value.appendChild(particle)
  }
  particles.value.push(particle)

  // 直接通过 left/top 动画，避免 transform 的叠加问题
  gsap.to(particle, {
    duration: PARTICLE_LIFETIME,
    // 目标位置：鼠标位置 + 随机偏移
    left: `${x + (Math.random() * 150 - 50)}px`,
    top: `${y + (Math.random() * 150 - 50)}px`,
    // 初始位置：鼠标位置
    startAt: { left: `${x}px`, top: `${y}px` },
    scale: 10,
    opacity: 0,
    ease: 'power1.out',
    onComplete: () => {
      particle.remove()
      const index = particles.value.indexOf(particle)
      if (index !== -1) particles.value.splice(index, 1)
    },
  })
}

const handleMouseMove = (event: MouseEvent) => {
  const now = Date.now()
  const interval = now - lastGenerateTime
  if (interval < generateInterval) {
    return
  }
  lastGenerateTime = now

  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if (particles.value.length <= MAX_PARTICLES) {
      createParticle(x, y)
    }
  }
}

onUnmounted(() => {
  particles.value.forEach((p) => p.remove())
  particles.value = []
})
</script> -->

<style>
/* body {
  background-color: red;
} */
</style>

<style scoped>
.el-container {
  width: var(--header-length);
  margin: 0 auto;
}

.el-header {
  position: fixed;
  top: 0;
  width: var(--header-length);
  z-index: 1000;
}

.el-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  position: relative;
  top: var(--header-height);
  overflow: visible;
}

.el-footer {
  height: 300px;
}
</style>
