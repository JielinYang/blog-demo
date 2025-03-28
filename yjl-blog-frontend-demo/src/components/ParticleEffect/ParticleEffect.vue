<!-- components/ParticleEffect/ParticleEffect.vue -->
<template>
  <div></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import useParticleGenerator from './useParticleGenerator'

const containerRef = ref<HTMLElement | null>(null)
containerRef.value = document.body
const { initParticles, destroyParticles } = useParticleGenerator()

onMounted(() => initParticles(containerRef))
onUnmounted(destroyParticles)
</script>

<style lang="scss" scoped>
@import './particle.scss';
</style>
