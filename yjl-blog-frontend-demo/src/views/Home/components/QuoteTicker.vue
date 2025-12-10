<template>
  <div class="quote-ticker">
    <h1 class="blog-title">FBranch's Blog</h1>
    <div class="quote-container">
      <transition name="fade" mode="out-in">
        <p :key="currentQuoteIndex" class="quote-text bitcount-prop-single">
          "{{ currentQuote.text }}"
          <span class="quote-author">— {{ currentQuote.author }}</span>
        </p>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Quote {
  text: string
  author: string
}

const quotes: Quote[] = [
  { text: '请仰望星空，而非只顾脚下。', author: '斯蒂芬·霍金' },
  {
    text: '就我而言，我一无所知，但凝望星辰总能让我梦想飞扬。',
    author: '文森特·梵高',
  },
  { text: '在某个地方，总有不可思议的事物正待被发现。', author: '卡尔·萨根' },
  {
    text: '我们都身处阴沟，但仍有人仰望星空。',
    author: '奥斯卡·王尔德',
  },
]

const currentQuoteIndex = ref(0)
const currentQuote = computed(() => quotes[currentQuoteIndex.value])
let intervalId: number

onMounted(() => {
  intervalId = window.setInterval(() => {
    currentQuoteIndex.value = (currentQuoteIndex.value + 1) % quotes.length
  }, 10000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<style scoped>
.quote-ticker {
  text-align: center;
  color: #fff;
  padding: 1rem;
  font-family: 'Georgia', serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.blog-title {
  font-size: 6rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
  letter-spacing: 2px;
  color: white;
  /* background: white; */
  /* -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; */
}

.quote-container {
  height: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.quote-text {
  font-size: 2rem;
  font-style: italic;
  max-width: 1000px;
  margin: 0 auto;
  line-height: 1.5;
}

.quote-author {
  display: block;
  font-size: 1rem;
  margin-top: 0.5rem;
  font-style: normal;
  opacity: 0.8;
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
