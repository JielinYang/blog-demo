<template>
  <div
    class="article-carousel"
    ref="containerRef"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    @mousemove="onMouseMove"
    @touchmove="onTouchMove"
    @mouseup="onMouseUp"
    @touchend="onTouchEnd"
    @mouseleave="onMouseUp"
  >
    <div class="article-info">
      <transition name="fade" mode="out-in">
        <div :key="currentArticle?.id" class="info-content" v-if="currentArticle">
          <h2 class="article-title" @click="goToDetail(currentArticle.id)">{{ currentArticle.title }}</h2>
          <p class="article-date">{{ formatDate(currentArticle.createTime) }}</p>
        </div>
      </transition>
    </div>

    <!-- Dot Indicators -->
    <div class="dots-container">
      <div
        v-for="(article, index) in articleList"
        :key="article.id"
        class="dot"
        :class="{ active: index === currentIndex }"
        @click.stop="goToIndex(index)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticleStore } from '@/stores/article'
import * as THREE from 'three'
import starryNightImg from '@/assets/img/starry-night-original.jpg'

const articleStore = useArticleStore()
const { articleList } = storeToRefs(articleStore)
const router = useRouter()
const defaultImg = starryNightImg

const containerRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const currentArticle = computed(() => articleList.value[currentIndex.value])

// Three.js variables
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let carouselGroup: THREE.Group
let animationId: number
const cards: { mesh: THREE.Points; angle: number }[] = []
let raycaster: THREE.Raycaster
const mouse = new THREE.Vector2(-1000, -1000)

// Carousel Config
const RADIUS = 600
const CARD_WIDTH = 400
const CARD_HEIGHT = 400

// Interaction State
// Interaction State
let isDragging = false
let startX = 0
let startY = 0
let startTime = 0
let currentRotation = 0
let targetRotation = 0
let dragVelocity = 0
let lastX = 0

onMounted(async () => {
  await articleStore.getArticleList(1, 6)
  initThree()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (scene) scene.clear()
})

watch(articleList, () => {
  if (scene) {
    scene.clear()
    initThree()
  }
})

const initThree = () => {
  if (!containerRef.value || articleList.value.length === 0) return

  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000)
  camera.position.z = RADIUS + 1000
  camera.position.y = -100 // Move camera up to shift content upward
  camera.lookAt(0, -100, RADIUS) // Adjust lookAt target to match camera position

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  containerRef.value.appendChild(renderer.domElement)

  raycaster = new THREE.Raycaster()

  carouselGroup = new THREE.Group()
  scene.add(carouselGroup)

  const angleStep = (Math.PI * 2) / articleList.value.length
  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'Anonymous'

  articleList.value.forEach((article, index) => {
    const url = article.coverUrl || defaultImg
    loader.load(url, (texture) => {
      const card = createParticleCard(texture)
      const angle = index * angleStep

      card.position.x = Math.sin(angle) * RADIUS
      card.position.z = Math.cos(angle) * RADIUS
      card.rotation.y = angle
      
      // Store article ID for click handling
      card.userData = { articleId: article.id }

      carouselGroup.add(card)
      cards.push({ mesh: card, angle })
    })
  })

  animate()
}

const createParticleCard = (texture: THREE.Texture) => {
  const planeWidth = CARD_WIDTH
  const planeHeight = CARD_HEIGHT

  const numParticlesX = 200
  const numParticlesY = 200

  const numParticles = numParticlesX * numParticlesY

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(numParticles * 3)
  const uvs = new Float32Array(numParticles * 2)
  const randoms = new Float32Array(numParticles)

  let i = 0
  for (let y = 0; y < numParticlesY; y++) {
    for (let x = 0; x < numParticlesX; x++) {
      const u = (x / numParticlesX) * 1.4 - 0.2
      const v = (y / numParticlesY) * 1.4 - 0.2

      const px = (u - 0.5) * planeWidth
      const py = (v - 0.5) * planeHeight
      const pz = 0

      positions[i * 3] = px
      positions[i * 3 + 1] = py
      positions[i * 3 + 2] = pz

      uvs[i * 2] = u
      uvs[i * 2 + 1] = v

      randoms[i] = Math.random()

      i++
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uDragIntensity: { value: 0 },
      uOpacity: { value: 1.0 },
      uMouse: { value: new THREE.Vector2(-1000, -1000) },
      uHoverState: { value: 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uDragIntensity;
      uniform vec2 uMouse;
      uniform float uHoverState;
      attribute float aRandom;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        vUv = uv;
        vec3 pos = position;

        float distFromCenter = distance(uv, vec2(0.5));

        // Movement speed increases quadratically from center to edge
        float movementSpeed = smoothstep(0.0, 0.5, distFromCenter);
        movementSpeed = movementSpeed * movementSpeed;

        float noise = sin(pos.y * 0.1 + uTime) * cos(pos.x * 0.1 + uTime);
        pos.x += noise * uDragIntensity * 50.0 * aRandom;
        pos.y += noise * uDragIntensity * 50.0 * aRandom;
        pos.z += uDragIntensity * 100.0 * aRandom;

        // Coordinated wave motion - particles move together in harmony
        // Create flowing wave patterns based on position, not random
        float wavePhase = uTime * 0.5; // Increased from 0.3 to 0.5 for faster movement

        // Horizontal wave
        float waveX = sin(pos.y * 0.02 + wavePhase) * cos(pos.x * 0.015 + wavePhase * 0.7);
        // Vertical wave
        float waveY = cos(pos.x * 0.02 + wavePhase * 0.8) * sin(pos.y * 0.015 + wavePhase * 0.5);

        // Apply gentle, coordinated movement with increased amplitude
        pos.x += waveX * 10.0 * movementSpeed; // Increased from 4.0 to 8.0
        pos.y += waveY * 10.0 * movementSpeed; // Increased from 4.0 to 8.0

        // Subtle z-axis breathing for depth
        float breathe = sin(wavePhase + distFromCenter * 3.0) * 3.0 * movementSpeed; // Increased from 2.0 to 3.0
        pos.z += breathe;

        // Smooth and elegant hover effect - only z-axis pop
        float distToMouse = distance(pos.xy, uMouse);
        float hoverRadius = 200.0;

        if (distToMouse < hoverRadius && uHoverState > 0.01) {
          float force = (hoverRadius - distToMouse) / hoverRadius;
          // Smoother falloff curve
          force = smoothstep(0.0, 1.0, force);

          // Gentle floating effect
          float floatEffect = sin(uTime * 2.0 + distToMouse * 0.05) * 5.0;

          // Only pop forward, no xy displacement to maintain aspect ratio
          // Reduced range for more subtle effect
          pos.z += (force * 30.0 + floatEffect) * uHoverState;
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (10.0 + aRandom * 4.0) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = 1.0 - smoothstep(0.6, 0.7, distFromCenter);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        vec2 clampedUv = clamp(vUv, 0.0, 1.0);
        vec4 color = texture2D(uTexture, clampedUv);

        // Calculate distance from image center (0.5, 0.5)
        float distFromCenter = distance(vUv, vec2(0.5));

        // Glow intensity decreases with distance from center
        // Center particles have stronger glow, edge particles have weaker glow
        float glowStrength = 1.0 - smoothstep(0.0, 0.5, distFromCenter);
        glowStrength = pow(glowStrength, 0.5); // Soften the falloff

        // Particle shape with soft edges
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        // Soft glow based on particle shape
        float particleGlow = 1.0 - smoothstep(0.2, 0.5, dist);

        // Combine particle glow with position-based glow
        float finalGlow = particleGlow * (1.0 + glowStrength * 0.8);

        // Use original sampled color without modification
        gl_FragColor = vec4(color.rgb * finalGlow, color.a * vAlpha * finalGlow * uOpacity);
      }
    `,
    transparent: true,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.Points(geometry, material)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  currentRotation += (targetRotation - currentRotation) * 0.1
  carouselGroup.rotation.y = currentRotation

  if (!isDragging) {
    dragVelocity *= 0.95
    if (Math.abs(dragVelocity) < 0.001) {
      const step = (Math.PI * 2) / articleList.value.length
      const snapTarget = Math.round(targetRotation / step) * step
      targetRotation += (snapTarget - targetRotation) * 0.1
      updateCurrentIndex()
    } else {
      targetRotation += dragVelocity
    }
  } else {
    targetRotation += dragVelocity
  }

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(carouselGroup.children)

  carouselGroup.children.forEach((child: any) => {
    if (child.material) {
      // Slower fade out for smoother transition
      child.material.uniforms.uHoverState.value +=
        (0 - child.material.uniforms.uHoverState.value) * 0.05
    }
  })

  if (intersects.length > 0) {
    const intersection = intersects[0]
    const hoveredMesh = intersection.object as THREE.Points
    if (hoveredMesh.material) {
      // Slower fade in for smoother hover effect
      ;(hoveredMesh.material as THREE.ShaderMaterial).uniforms.uHoverState.value +=
        (1.0 - (hoveredMesh.material as THREE.ShaderMaterial).uniforms.uHoverState.value) * 0.08

      const localPoint = hoveredMesh.worldToLocal(intersection.point.clone())
      // Smooth mouse position update
      const currentMouse = (hoveredMesh.material as THREE.ShaderMaterial).uniforms.uMouse.value
      currentMouse.lerp(localPoint, 0.15)
    }
  }

  const intensity = Math.abs(dragVelocity) * 0.05
  const step = (Math.PI * 2) / articleList.value.length

  cards.forEach((cardObj) => {
    const mesh = cardObj.mesh
    if (mesh.material) {
      ;(mesh.material as THREE.ShaderMaterial).uniforms.uTime.value += 0.01
      ;(mesh.material as THREE.ShaderMaterial).uniforms.uDragIntensity.value +=
        (intensity - (mesh.material as THREE.ShaderMaterial).uniforms.uDragIntensity.value) * 0.1

      let worldAngle = (cardObj.angle + currentRotation) % (Math.PI * 2)
      if (worldAngle < 0) worldAngle += Math.PI * 2
      if (worldAngle > Math.PI) worldAngle -= Math.PI * 2

      const isVisible = Math.abs(worldAngle) < step * 1.8
      const targetOpacity = isVisible
        ? Math.max(0, 1.0 - Math.pow(Math.abs(worldAngle) / (step * 1.8), 2.0))
        : 0
      ;(mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value +=
        (targetOpacity - (mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value) * 0.1
    }
  })

  renderer.render(scene, camera)
}

const updateCurrentIndex = () => {
  const step = (Math.PI * 2) / articleList.value.length
  let rot = -currentRotation % (Math.PI * 2)
  if (rot < 0) rot += Math.PI * 2

  let index = Math.round(rot / step) % articleList.value.length
  if (index < 0) index += articleList.value.length

  if (currentIndex.value !== index) {
    currentIndex.value = index
  }
}

const goToIndex = (index: number) => {
  const step = (Math.PI * 2) / articleList.value.length
  const currentAngle = -currentRotation
  const targetAngle = index * step

  let diff = targetAngle - currentAngle
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2

  targetRotation = -(currentAngle + diff)
}

const onMouseDown = (e: MouseEvent) => {
  isDragging = true
  startX = e.clientX
  startY = e.clientY
  startTime = Date.now()
  lastX = e.clientX
  dragVelocity = 0
}

const onTouchStart = (e: TouchEvent) => {
  isDragging = true
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startTime = Date.now()
  lastX = e.touches[0].clientX
  dragVelocity = 0
}

const onMouseMove = (e: MouseEvent) => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  if (!isDragging) return
  const delta = e.clientX - lastX
  dragVelocity = delta * 0.005
  lastX = e.clientX
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging) return
  const delta = e.touches[0].clientX - lastX
  dragVelocity = delta * 0.005
  lastX = e.touches[0].clientX
}

const onMouseUp = (e: MouseEvent) => {
  isDragging = false
  
  // Check for click (short duration and small movement)
  const duration = Date.now() - startTime
  const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2))
  
  if (duration < 300 && dist < 10) {
    // It's a click! Perform raycast
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(carouselGroup.children)
      
      if (intersects.length > 0) {
        const object = intersects[0].object
        if (object.userData && object.userData.articleId) {
          goToDetail(object.userData.articleId)
        }
      }
    }
  }

  mouse.set(-1000, -1000)
}

const onTouchEnd = (e: TouchEvent) => {
  isDragging = false
  
  // For touch, we can't easily get the "mouseup" position from touchend event directly 
  // without tracking touchmove, but for simple tap detection:
  // If dragVelocity is very small, we can assume it's a tap.
  // However, accurate tap detection on 3D objects with touch is trickier.
  // For now, let's rely on the fact that if it wasn't a drag, it might be a tap.
  // But we need coordinates for raycasting.
  // A better way for touch is to use the last known touch position if movement was small.
  
  // Simplified: just reset for now. Implementing robust touch raycasting requires tracking last touch pos.
  mouse.set(-1000, -1000)
}

const goToDetail = (id: number) => {
  router.push(`/article/${id}`)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.article-carousel {
  width: 100%;
  height: 80vh;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.article-carousel:active {
  cursor: grabbing;
}

.article-info {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
  z-index: 10;
}

.article-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-family: 'Microsoft YaHei', serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: center;
  line-height: 1.2;
  cursor: pointer;
  transition: transform 0.3s ease, text-shadow 0.3s ease;
}

.article-title:hover {
  transform: scale(1.05);
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

.article-date {
  font-size: 1rem;
  opacity: 0.8;
  letter-spacing: 2px;
}

.dots-container {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.2);
}

.dot.active {
  background: #fff;
  transform: scale(1.4);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
