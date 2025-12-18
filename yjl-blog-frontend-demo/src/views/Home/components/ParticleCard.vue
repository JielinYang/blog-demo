<template>
  <div
    ref="containerRef"
    class="particle-card-container"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  imageUrl: string
  width?: number
  height?: number
}>()

const containerRef = ref<HTMLElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particles: THREE.Points
let animationId: number
let material: THREE.ShaderMaterial

// Mouse interaction
const mouse = new THREE.Vector2(-1000, -1000)
const targetMouse = new THREE.Vector2(-1000, -1000)

const initThree = () => {
  if (!containerRef.value) return

  const w = props.width || containerRef.value.clientWidth
  const h = props.height || containerRef.value.clientHeight

  // Scene
  scene = new THREE.Scene()

  // Camera
  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000)
  camera.position.z = 300

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  containerRef.value.appendChild(renderer.domElement)

  // Load Texture
  const loader = new THREE.TextureLoader()
  loader.crossOrigin = 'Anonymous'
  loader.load(props.imageUrl, (texture) => {
    createParticles(texture)
  })
}

const createParticles = (texture: THREE.Texture) => {
  // Image aspect ratio
  const imgAspect =
    (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
  const planeHeight = 150
  const planeWidth = planeHeight * imgAspect

  const numParticlesX = 150
  const numParticlesY = Math.round(150 / imgAspect)
  const numParticles = numParticlesX * numParticlesY

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(numParticles * 3)
  const uvs = new Float32Array(numParticles * 2)
  const indices = new Float32Array(numParticles)

  let i = 0
  for (let y = 0; y < numParticlesY; y++) {
    for (let x = 0; x < numParticlesX; x++) {
      const u = x / numParticlesX
      const v = y / numParticlesY

      // Center the plane
      const px = (u - 0.5) * planeWidth
      const py = (v - 0.5) * planeHeight
      const pz = 0

      positions[i * 3] = px
      positions[i * 3 + 1] = py
      positions[i * 3 + 2] = pz

      uvs[i * 2] = u
      uvs[i * 2 + 1] = v

      indices[i] = i
      i++
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1))

  // Shader Material
  material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uMouse: { value: new THREE.Vector2(-1000, -1000) },
      uTime: { value: 0 },
      uHover: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uHover;
      attribute float aIndex;
      varying vec2 vUv;

      // Simple pseudo-random noise
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Add static noise for "broken" look
        float noise = random(pos.xy);
        pos.z += noise * 10.0;

        // Mouse interaction (simple repulsion)
        float dist = distance(uMouse, pos.xy);
        float radius = 50.0;

        if (dist < radius) {
          float force = (radius - dist) / radius;
          pos.z += force * 50.0 * uHover; // Pop out more

          // Slight xy displacement
          vec2 dir = normalize(pos.xy - uMouse);
          pos.xy += dir * force * 10.0 * uHover;
        }

        // Gentle wave
        pos.z += sin(pos.x * 0.05 + uTime) * 5.0;
        pos.y += cos(pos.y * 0.05 + uTime) * 2.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        // Larger particles
        gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(uTexture, vUv);
        if (color.a < 0.1) discard;
        gl_FragColor = color;
      }
    `,
    transparent: true,
    depthTest: false,
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  animate()
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (material) {
    material.uniforms.uTime.value += 0.02

    // Smooth mouse
    mouse.lerp(targetMouse, 0.1)
    material.uniforms.uMouse.value.copy(mouse)
  }

  renderer.render(scene, camera)
}

const onMouseMove = (e: MouseEvent) => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Map to plane coordinates (approximate based on camera z=300 and FOV 50)
  // Visible height at z=0: 2 * 300 * tan(25deg) ~= 279
  const visibleHeight = 2 * 300 * Math.tan((50 * Math.PI) / 360)
  const visibleWidth = visibleHeight * (rect.width / rect.height)

  const px = (x / rect.width - 0.5) * visibleWidth
  const py = -(y / rect.height - 0.5) * visibleHeight // Invert Y

  targetMouse.set(px, py)
  if (material) material.uniforms.uHover.value = 1
}

const onMouseLeave = () => {
  targetMouse.set(-1000, -1000)
  if (material) material.uniforms.uHover.value = 0
}

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (scene) scene.clear()
})

watch(
  () => props.imageUrl,
  () => {
    // Reload texture if prop changes
    if (scene) scene.clear()
    initThree()
  },
)
</script>

<style scoped>
.particle-card-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
}
</style>
