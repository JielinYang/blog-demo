// components/ParticleEffect/useParticleGenerator.js
import { gsap } from 'gsap'
import { ref } from 'vue'

export default function useParticleGenerator() {
  const particles = ref<HTMLDivElement[]>([])
  const container = ref<HTMLElement | null>(null)
  const MAX_PARTICLES = 100
  const PARTICLE_LIFETIME = 1.5
  let lastGenerateTime = Date.now()
  const GENERATE_INTERVAL = 100

  // 配置参数（可通过props扩展）
  const config = {
    colors: ['#ffcc00', '#42b983', '#35495e'],
    shapes: ['circle', 'square'],
    sizeRange: [2, 6],
    background:
      'radial-gradient(circle at center, #ffcc00 0%, rgba(255, 204, 0, 0.5) 50%, rgba(255, 204, 0, 0) 100%)',
  }

  const getBackground = () => config.background

  const createParticle = (x: number, y: number) => {
    const particle = document.createElement('div')
    const size = Math.random() * (config.sizeRange[1] - config.sizeRange[0]) + config.sizeRange[0]

    // 粒子基础样式
    Object.assign(particle.style, {
      position: 'absolute',
      top: `${y}px`,
      left: `${x}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: getBackground(),
      borderRadius: '50%',
      pointerEvents: 'none',
    })

    if (container.value) {
      container.value.appendChild(particle)
    }

    particles.value.push(particle)

    // GSAP动画
    gsap.to(particle, {
      duration: PARTICLE_LIFETIME,
      left: `${x + (Math.random() * 150 - 50)}px`,
      top: `${y + (Math.random() * 150 - 50)}px`,
      scale: 10,
      opacity: 0,
      ease: 'power1.out',
      onComplete: () => removeParticle(particle),
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (Date.now() - lastGenerateTime < GENERATE_INTERVAL) {
      return
    }
    lastGenerateTime = Date.now()

    if (particles.value.length < MAX_PARTICLES && container.value) {
      const rect = container.value.getBoundingClientRect()
      createParticle(e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  const removeParticle = (particle: HTMLDivElement) => {
    particle.remove()
    particles.value = particles.value.filter((p) => p !== particle)
  }

  const initParticles = (containerRef: { value: HTMLElement | null }) => {
    console.log(containerRef.value)
    if (containerRef.value) {
      container.value = containerRef.value
      if (container.value) {
        container.value.addEventListener('mousemove', handleMouseMove)
      }
    }
  }

  const destroyParticles = () => {
    if (container.value) {
      container.value.removeEventListener('mousemove', handleMouseMove)
    }
    particles.value.forEach((p) => p.remove())
    particles.value = []
  }

  return { initParticles, destroyParticles }
}
