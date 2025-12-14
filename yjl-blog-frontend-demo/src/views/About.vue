<template>
  <div class="about-container">
    <!-- 星空粒子背景 -->
    <div class="stars-container">
      <div
        v-for="(star, index) in stars"
        :key="index"
        class="star"
        :style="{
          left: star.x + 'px',
          top: star.y + 'px',
          width: star.size + 'px',
          height: star.size + 'px',
          opacity: star.opacity,
          animationDuration: star.duration + 's',
          animationDelay: star.delay + 's',
        }"
      ></div>
    </div>
    <div class="background-overlay"></div>

    <div class="content-wrapper animate__animated animate__fadeInUp">
      <div class="profile-card">
        <div class="avatar-placeholder">F</div>
        <h1 class="name">FBranch</h1>
        <p class="bio">
          爱好：学习、阅读、网球。<br />保持热情，探索未知。<br />Full Stack Developer.
        </p>

        <div class="social-links">
          <a href="https://github.com/JielinYang" target="_blank" class="social-btn github">
            <i class="fab fa-github"></i> GitHub
          </a>
          <a
            href="https://www.xiaohongshu.com/user/profile/6930e8310000000037003fa8"
            target="_blank"
            class="social-btn xiaohongshu"
          >
            <i class="fas fa-book-open"></i> 小红书
          </a>
        </div>
      </div>

      <div class="friendly-links-card">
        <h2 class="section-title">友情链接</h2>
        <div class="links-grid">
          <div class="empty-slot">
            <span>虚位以待...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 星空粒子系统
const stars = ref<
  Array<{
    x: number
    y: number
    size: number
    opacity: number
    duration: number
    delay: number
  }>
>([])

// 创建星空粒子
const createStars = () => {
  const starCount = 150 // 粒子数量
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    const duration = Math.random() * 30 + 20 // 20s - 50s
    newStars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, // 0.5px - 2.5px
      opacity: Math.random() * 0.8 + 0.2, // 0.2 - 1.0
      duration: duration,
      delay: -Math.random() * duration, // 负延迟使动画立即处于播放状态
    })
  }

  stars.value = newStars
}

// 窗口大小变化时重新创建粒子
const handleResize = () => {
  createStars()
}

onMounted(() => {
  createStars()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom left, #1b2735 0%, #090a0f 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 星空粒子容器 */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 单个星星 */
.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  animation: starFloat linear infinite;
}

/* 星星浮动动画 */
@keyframes starFloat {
  0% {
    transform: translateY(100vh) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0;
  }
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 600px;
}

.profile-card,
.friendly-links-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.profile-card:hover,
.friendly-links-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 20px rgba(118, 75, 162, 0.5);
}

.name {
  font-size: 2.5rem;
  color: white;
  margin: 0 0 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.bio {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social-btn {
  display: flex;
  align-items: center;
  padding: 10px 24px;
  border-radius: 50px;
  text-decoration: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.social-btn:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}

.section-title {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  display: block;
  width: 40px;
  height: 3px;
  background: #764ba2;
  margin: 10px auto 0;
  border-radius: 2px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.empty-slot {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.empty-slot:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.6);
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate__fadeInUp {
  animation-name: fadeInUp;
  animation-duration: 0.8s;
  animation-fill-mode: both;
}
</style>
