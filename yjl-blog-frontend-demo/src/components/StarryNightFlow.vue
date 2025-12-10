<template>
  <div ref="containerRef" class="starry-night-container">
    <canvas ref="canvasRef"></canvas>
    <div class="gradient-mask"></div>
    <!-- <img :src="starryNightImg" class="reference-image" /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import starryNightImg from '@/assets/img/starry-night-original.jpg'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 1. Core Configuration
const PARTICLE_COUNT = 10000 // Must be dense
const GRID_RESOLUTION = 32 // Best balance
const PARTICLE_SPEED_BASE = 1 // Adjusted for inertia
const PARTICLE_LIFE_MAX = 200
const TRAIL_OPACITY = 0.025 // Key for oil painting look
const SMOOTHING_ITERATIONS = 20 // Crucial for smooth flow
const PARTICLE_RADIUS = 1
const OFFSET = 20 // For gradient calculation

// Types
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  life: number
  maxLife: number
  color: string
}

interface Vector {
  x: number
  y: number
}

// State
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number
// Performance Optimization: Non-reactive particles array
let particles: Particle[] = []
let flowField: Vector[][] = []
let cols = 0
let rows = 0
let width = 0
let height = 0
let imageBitmap: ImageBitmap | null = null
let particleColorData: Uint8ClampedArray | null = null
let particleImgWidth: number = 0

// Initialize
onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return

  ctx = canvasRef.value.getContext('2d', { alpha: false })
  if (!ctx) return

  // Load image with crossOrigin anonymous if needed (though local assets usually fine)
  const img = new Image()
  img.src = starryNightImg
  img.crossOrigin = 'Anonymous'

  img.onload = async () => {
    imageBitmap = await createImageBitmap(img)
    initCanvas()
    window.addEventListener('resize', handleResize)
    animate()
  }

  img.onerror = (e) => {
    console.error('Failed to load starry night image:', e)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  initCanvas()
}

const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value || !imageBitmap || !ctx) return

  width = Math.floor(window.innerWidth)
  height = Math.floor(window.innerHeight)

  canvasRef.value.width = width
  canvasRef.value.height = height

  cols = Math.ceil(width / GRID_RESOLUTION)
  rows = Math.ceil(height / GRID_RESOLUTION)

  generateFlowField()
  initParticles()
}

// 2. Critical Algorithms: Flow Field Generation
const generateFlowField = () => {
  if (!imageBitmap || !ctx) return

  ctx.drawImage(imageBitmap, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const imgWidth = imageData.width

  flowField = new Array(cols).fill(0).map(() => new Array(rows).fill({ x: 0, y: 0 }))

  // Calculate basic angles
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = x * GRID_RESOLUTION
      const py = y * GRID_RESOLUTION

      // Sobel variant with offset
      const left = getBrightness(data, px - OFFSET, py, imgWidth)
      const right = getBrightness(data, px + OFFSET, py, imgWidth)
      const up = getBrightness(data, px, py - OFFSET, imgWidth)
      const down = getBrightness(data, px, py + OFFSET, imgWidth)

      const dx = right - left
      const dy = down - up

      // Flow along contours
      const angle = Math.atan2(dy, dx) + Math.PI / 2

      flowField[x][y] = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }
    }
  }

  // Heavy Smoothing
  for (let i = 0; i < SMOOTHING_ITERATIONS; i++) {
    smoothFlowField()
  }

  // Clear canvas with dark blue background for initial state
  ctx.fillStyle = 'rgb(5, 5, 8)'
  ctx.fillRect(0, 0, width, height)
}

const getBrightness = (data: Uint8ClampedArray, x: number, y: number, imgWidth: number) => {
  // Clamp coordinates
  if (x < 0) x = 0
  if (x >= width) x = width - 1
  if (y < 0) y = 0
  if (y >= height) y = height - 1

  const index = (y * imgWidth + x) * 4
  return (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255
}

const smoothFlowField = () => {
  const newField = new Array(cols).fill(0).map(() => new Array(rows).fill({ x: 0, y: 0 }))

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let sumX = 0
      let sumY = 0
      let count = 0

      // 3x3 kernel
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nx = x + i
          const ny = y + j

          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            sumX += flowField[nx][ny].x
            sumY += flowField[nx][ny].y
            count++
          }
        }
      }

      if (count > 0) {
        // Average vector
        const avgX = sumX / count
        const avgY = sumY / count
        // Normalize (optional but good for consistent speed)
        const len = Math.sqrt(avgX * avgX + avgY * avgY) || 1

        newField[x][y] = {
          x: avgX / len,
          y: avgY / len,
        }
      }
    }
  }

  flowField = newField
}

const initParticles = () => {
  if (!imageBitmap || !ctx) return

  ctx.drawImage(imageBitmap, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)

  // Store image data for resampling
  particleColorData = imageData.data
  particleImgWidth = imageData.width

  // Clear again
  ctx.fillStyle = 'rgb(5, 5, 8)'
  ctx.fillRect(0, 0, width, height)

  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle())
  }
}

const sampleColor = (x: number, y: number): string => {
  if (!particleColorData) return 'rgb(255, 255, 255)'

  const ix = Math.floor(x)
  const iy = Math.floor(y)
  // Clamp coordinates to avoid out of bounds
  const clampedX = Math.max(0, Math.min(ix, width - 1))
  const clampedY = Math.max(0, Math.min(iy, height - 1))

  const index = (clampedY * particleImgWidth + clampedX) * 4
  const r = particleColorData[index]
  const g = particleColorData[index + 1]
  const b = particleColorData[index + 2]

  return `rgb(${r},${g},${b})`
}

const createParticle = (): Particle => {
  const x = Math.random() * width
  const y = Math.random() * height

  return {
    x,
    y,
    vx: 0,
    vy: 0,
    speed: Math.random() * 0.5 + 0.5,
    life: Math.random() * PARTICLE_LIFE_MAX,
    maxLife: PARTICLE_LIFE_MAX,
    color: sampleColor(x, y),
  }
}

// 3. Render Loop
const animate = () => {
  if (!ctx) return

  // Long trail effect with dark blue background
  ctx.fillStyle = `rgba(5, 5, 8, ${TRAIL_OPACITY})`
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    const col = Math.floor(p.x / GRID_RESOLUTION)
    const row = Math.floor(p.y / GRID_RESOLUTION)

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const force = flowField[col][row]

      // Particle Physics: Inertia interpolation
      // vx = vx * 0.8 + targetVx * 0.2
      p.vx = p.vx * 0.8 + force.x * PARTICLE_SPEED_BASE * 0.2
      p.vy = p.vy * 0.8 + force.y * PARTICLE_SPEED_BASE * 0.2
    }

    p.x += p.vx * p.speed
    p.y += p.vy * p.speed
    p.life--

    ctx.beginPath()
    ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()

    if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.x = Math.random() * width
      p.y = Math.random() * height
      p.vx = 0
      p.vy = 0
      p.life = Math.random() * PARTICLE_LIFE_MAX
      // Resample color on respawn
      p.color = sampleColor(p.x, p.y)
    }
  }

  animationFrameId = requestAnimationFrame(animate)
}
</script>

<style scoped>
.starry-night-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100%;
  overflow: hidden;
  background-color: rgb(5, 5, 8);
}

.gradient-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(5, 5, 8, 0) 60%, rgba(5, 5, 8, 0.9) 100%);
  pointer-events: none;
  z-index: 1;
}

canvas {
  display: block;
}

.reference-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}
</style>
