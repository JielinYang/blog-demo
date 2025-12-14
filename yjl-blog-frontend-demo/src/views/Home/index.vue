<template>
  <div class="home-container">
    <!-- Upper section with StarryNightFlow -->
    <div class="starry-section">
      <StarryNightFlow />
      <div class="quote-overlay">
        <QuoteTicker />
      </div>
      <!-- Gradient transition to black -->
      <div class="gradient-transition"></div>
    </div>

    <!-- Lower section with ArticleCarousel on pure black -->
    <div class="carousel-section">
      <ArticleCarousel />
    </div>

    <!-- Footer with ICP Info -->
    <footer class="site-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        蜀ICP备2025174984号
      </a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import StarryNightFlow from '@/components/StarryNightFlow.vue'
import QuoteTicker from './components/QuoteTicker.vue'
import ArticleCarousel from './components/ArticleCarousel.vue'
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: #000;
}

/* Upper section with StarryNightFlow - takes 40% of viewport */
.starry-section {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* QuoteTicker centered in StarryNightFlow */
.quote-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  width: 100%;
}

/* Smooth gradient transition from StarryNightFlow to pure black */
.gradient-transition {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.5) 40%, #000 100%);
  pointer-events: none;
  z-index: 5;
}

/* Lower section with ArticleCarousel - takes 60% of viewport */
.carousel-section {
  width: 100%;
  height: 80vh;
  background: #000;
  position: relative;
}

.site-footer {
  width: 100%;
  padding: 20px 40px;
  background: #000;
  text-align: right;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  overflow: hidden;
}

.site-footer a {
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  font-size: 12px;
  transition: color 0.3s ease;
  font-family: 'Microsoft YaHei', sans-serif;
  display: inline-block;
  line-height: 1.5;
}

.site-footer a:hover {
  color: rgba(255, 255, 255, 0.6);
}
</style>
