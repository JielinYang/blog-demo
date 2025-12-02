<template>
  <div id="app">
    <p>test</p>
    <canvas ref="canvasRef"></canvas>
    <a target="_blank" href="https://www.framer.com/@kevin-levron/">Framer Component</a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import LiquidBackground from '../assets/js/threejs-components/liquid1.min.js'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const app = ref<any>(null)

onMounted(() => {
  if (canvasRef.value) {
    app.value = LiquidBackground(canvasRef.value)

    app.value.loadImage('https://assets.codepen.io/33787/liquid.webp')
    app.value.liquidPlane.material.metalness = 0.75
    app.value.liquidPlane.material.roughness = 0.25
    app.value.liquidPlane.uniforms.displacementScale.value = 5
    app.value.setRain(false)
  }
})

onUnmounted(() => {
  if (app.value) {
    // 清理资源，防止内存泄漏
    app.value.dispose?.()
  }
})
</script>

<style scoped>
#app {
  margin: 0;
  width: 100%;
  height: 100vh;
  font-family: 'Montserrat', serif;
  position: relative;
}

#app canvas {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  z-index: 1;
}

#app p {
  position: relative;
  z-index: 2;
  color: #fff;
  padding: 20px;
  margin: 0;
}

#app a {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  text-decoration: none;
  text-shadow: 1px 1px 2px black;
  z-index: 2;
}

:global(body) {
  margin: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

:global(html) {
  margin: 0;
  width: 100%;
  height: 100%;
}
</style>
