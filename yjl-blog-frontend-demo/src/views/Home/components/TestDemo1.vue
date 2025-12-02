<template>
  <div ref="fixedBg" class="fixed-bg">
    <canvas ref="canvas2"></canvas>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

// 1. Vue 3 Composition API - 创建响应式引用
const fixedBg = ref<HTMLDivElement>() // 背景容器引用
const canvas = ref<HTMLCanvasElement>() // 主Canvas（圣诞树粒子）
const canvas2 = ref<HTMLCanvasElement>() // 副Canvas（雪花粒子）

// 2. Canvas上下文变量
let ctx: CanvasRenderingContext2D | null = null // 主Canvas绘图上下文
let ctx2: CanvasRenderingContext2D | null = null // 副Canvas绘图上下文

// 3. 动态计算Canvas尺寸，确保覆盖整个屏幕
const calculateCanvasSize = () => {
  // 获取屏幕尺寸，并乘以一个系数确保覆盖整个视口
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const scale = 1.5 // 1.5倍缩放确保高清显示（不是2倍）

  return {
    cw: Math.max(screenWidth, screenHeight) * scale, // Canvas宽度（取屏幕最大边）
    ch: Math.max(screenWidth, screenHeight) * scale, // Canvas高度
  }
}

// 4. 全局常量定义
const { cw, ch } = calculateCanvasSize() // 解构获取Canvas宽高
const T = Math.PI * 2 // 2π，完整圆的弧度（约6.283）
const m = { x: cw / 2, y: 0 } // 鼠标位置对象（初始在Canvas水平中心，顶部）
let xTo: any = null // GSAP快速更新x坐标的函数
let yTo: any = null // GSAP快速更新y坐标的函数
const y_start = ch / 4
const y_end = ch
const h_stump = 300
const max_radius = 770

// 5. 数据存储数组
const arr: any[] = [] // 存储圣诞树粒子对象数组
const arr_branch: any[] = [] // 存储圣诞树分支粒子对象数组
const arr2: any[] = [] // 存储雪花粒子对象数组
const lightCenters: any[] = [] // 存储发光中心数组
let animationId: number | null = null // 动画循环ID，用于取消动画

// 圣诞树相关颜色数组 - 柔和的圣诞色调
const christmasColors = [
  '#E74C3C', // 柔和的红色
  '#27AE60', // 柔和的绿色
  '#F39C12', // 柔和的黄色
  '#3498DB', // 柔和的蓝色
  '#9B59B6', // 柔和的紫色
  '#E67E22', // 柔和的橙色
  '#1ABC9C', // 柔和的青色
  '#F1C40F', // 柔和的金色
]

// 6. 鼠标移动事件处理函数
const handlePointerMove = (e: PointerEvent) => {
  if (!canvas.value) return

  // 计算鼠标在Canvas中的相对位置
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = e.x - rect.left
  const mouseY = e.y - rect.top

  // 计算Canvas缩放比例（CSS尺寸 vs 实际像素尺寸）
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  // 缩放鼠标坐标到Canvas实际像素坐标
  const scaledMouseX = mouseX * scaleX
  const scaledMouseY = mouseY * scaleY

  // 使用GSAP平滑更新鼠标位置
  xTo(scaledMouseX)
  yTo(scaledMouseY)
}

// 7. 主渲染循环函数
const render = () => {
  if (!ctx || !ctx2) return

  // 清空两个Canvas画布
  ctx.clearRect(0, 0, cw, ch)
  ctx2.clearRect(0, 0, cw, ch)

  // 绘制发光中心
  lightCenters.forEach((center) => drawLightCenter(center))

  // 绘制所有粒子
  arr.forEach((c) => drawDot(c)) // 绘制圣诞树粒子
  arr_branch.forEach((c) => drawDot(c, true)) // 绘制圣诞树分支粒子（标记为分支）
  arr2.forEach((c) => drawSnow(c)) // 绘制雪花粒子

  // 递归调用，创建动画循环（约60fps）
  animationId = requestAnimationFrame(render)
}

// 8. 绘制发光中心函数
const drawLightCenter = (center: any) => {
  if (!ctx) return

  // 根据强度计算透明度（缓入缓出效果）
  // 使用平方缓动，使变化更柔和
  const smoothIntensity = center.intensity * center.intensity
  const baseAlpha = Math.floor(smoothIntensity * 60) // 增加基础透明度范围
  const glowAlpha = Math.floor(smoothIntensity * 30) // 增加光晕透明度范围

  // 绘制发光中心的光晕效果（根据强度变化）
  ctx.beginPath()
  ctx.arc(center.x, center.y, 60, 0, T)
  ctx.fillStyle = center.color + glowAlpha.toString(16).padStart(2, '0')
  ctx.fill()

  // 绘制发光中心（根据强度变化）
  ctx.beginPath()
  ctx.arc(center.x, center.y, 30, 0, T)
  ctx.fillStyle = center.color + baseAlpha.toString(16).padStart(2, '0')
  ctx.fill()
}

// 9. 绘制圣诞树粒子函数
const drawDot = (c: any, isBranch: boolean = false) => {
  if (!ctx) return

  // 计算粒子在椭圆轨迹上的位置
  const angle = c.prog * T // 角度（弧度）：prog从0到1对应0到2π弧度
  const vs = 0.2 // 垂直缩放因子，控制椭圆形状（扁平化）
  const x = Math.cos(angle) * c.r + c.cx // x坐标：椭圆轨迹的水平分量 + 中心点x
  const y = Math.sin(angle) * c.r * vs + c.cy // y坐标：椭圆轨迹的垂直分量（缩放后） + 中心点y

  // 计算与鼠标的距离，用于交互效果
  const d = Math.sqrt((x - m.x) ** 2 + (y - m.y) ** 2)
  const interaction_distance = 800 // 设置交互距离为800像素

  // 如果距离超过800像素，使用正常大小，否则根据距离计算缩放因子
  // 分支粒子不受鼠标交互影响，保持固定大小
  const ms = isBranch
    ? 1
    : d > interaction_distance
      ? 1
      : gsap.utils.clamp(0.2, 1, d / interaction_distance)

  // 检查粒子是否在发光中心范围内（分支粒子不受影响）
  let inLightRange = false
  let finalColor = '#fff' // 最终颜色
  let totalIntensity = 0
  let weightedR = 0,
    weightedG = 0,
    weightedB = 0

  if (!isBranch) {
    // 只有非分支粒子才受发光中心影响
    lightCenters.forEach((center) => {
      const distanceToCenter = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2)
      if (distanceToCenter <= 300) {
        // 增加影响范围到300像素
        inLightRange = true
        // 使用更平滑的衰减函数，避免突然变化
        const distanceRatio = distanceToCenter / 300 // 使用新的范围值
        const distanceIntensity = Math.pow(1 - distanceRatio, 3) // 立方衰减，更柔和
        const combinedIntensity = distanceIntensity * center.intensity

        if (combinedIntensity > 0.01) {
          // 降低阈值，使更多发光中心参与计算
          // 解析颜色分量
          const r = parseInt(center.color.slice(1, 3), 16)
          const g = parseInt(center.color.slice(3, 5), 16)
          const b = parseInt(center.color.slice(5, 7), 16)

          // 加权累加颜色分量
          weightedR += r * combinedIntensity
          weightedG += g * combinedIntensity
          weightedB += b * combinedIntensity
          totalIntensity += combinedIntensity
        }
      }
    })
  }

  // 设置粒子颜色
  if (!isBranch && inLightRange && totalIntensity > 0.05) {
    // 降低总强度阈值
    // 计算加权平均颜色
    const finalR = Math.round(weightedR / totalIntensity)
    const finalG = Math.round(weightedG / totalIntensity)
    const finalB = Math.round(weightedB / totalIntensity)

    // 使用平滑的强度曲线
    const smoothIntensity = Math.pow(totalIntensity, 0.7) // 使用0.7次方，使变化更平缓
    const alpha = 0.02 + smoothIntensity * 0.5 // 扩大透明度范围：0.02-0.52

    finalColor = `rgb(${finalR}, ${finalG}, ${finalB})`
    ctx.fillStyle = finalColor
    ctx.strokeStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`
  } else {
    // 分支粒子或不在发光中心范围内，使用默认颜色
    finalColor = '#fff'
    ctx.fillStyle = finalColor
    ctx.strokeStyle = 'rgba(255,255,255,0.02)' // 降低默认透明度
  }

  // 绘制粒子
  ctx.beginPath()
  ctx.arc(x, y, (c.dot * c.s) / 2 / ms, 0, T) // 绘制圆形，大小受缩放因子s和距离影响
  ctx.fill() // 填充圆形

  // 绘制粒子边框（用于发光效果）
  ctx.lineWidth = (c.dot * c.s * 2) / ms // 线宽也受缩放和距离影响
  ctx.stroke() // 描边
}

// 10. 绘制雪花粒子函数
const drawSnow = (c: any) => {
  if (!ctx2) return

  // 计算雪花大小随下落距离的变化（越往下越小）
  const ys = gsap.utils.interpolate(1.3, 0.1, c.y / ch) // y坐标从0到ch，ys从1.3到0.1

  // 绘制雪花
  ctx2.beginPath()
  ctx2.arc(c.x, c.y, c.s * ys, 0, T) // 绘制圆形，大小随下落变化
  ctx2.globalAlpha = c.a * ys // 透明度也随下落变化（淡入淡出）
  ctx2.fill() // 填充
}

// 11. 创建发光中心函数
const createLightCenters = () => {
  const numCenters = 30 // 创建10个发光中心
  const x1 = cw / 2 - max_radius
  const x2 = cw / 2 + max_radius
  const y1 = y_start
  const y2 = y_end - h_stump
  const xc = cw / 2
  const yc = y_start
  const k1 = (y2 - yc) / (x2 - xc)
  const k2 = (y2 - yc) / (x1 - xc)

  for (let i = 0; i < numCenters; i++) {
    // 在圣诞树范围内随机生成位置（圣诞树大致在Canvas中心，高度从y_start到y_end）
    let centerX = xc + (Math.random() - 0.5) * (max_radius * 2) // 在中心±200像素范围内
    let centerY = yc + Math.random() * (y2 - y1) // 在圣诞树高度范围内
    const k = (centerY - yc) / (centerX - xc)
    if (k > k2 && k < k1) {
      if (centerX > xc) {
        centerX = x2 - centerX + xc
      } else {
        centerX = x1 - centerX + xc
      }
      centerY = y2 - centerY + yc
    }

    // 随机选择圣诞树颜色
    const randomColor = christmasColors[Math.floor(Math.random() * christmasColors.length)]

    lightCenters.push({
      x: centerX,
      y: centerY,
      color: randomColor,
      intensity: 0, // 初始强度为0
    })

    // 为每个发光中心创建缓入缓出的闪烁动画
    const center = lightCenters[i]
    const randomDelay = Math.random() * 8 // 随机延迟0-8秒
    const randomDuration = 2 + Math.random() * 4 // 随机持续时间2-6秒
    const randomRepeatDelay = Math.random() * 3 + 0.5 // 随机重复延迟0.5-3.5秒

    center.t = gsap
      .timeline({
        repeat: -1,
        yoyo: true,
        repeatDelay: randomRepeatDelay,
        delay: randomDelay, // 添加随机延迟开始
      })
      .to(center, {
        duration: randomDuration, // 使用随机持续时间
        intensity: 1,
        ease: 'power2.inOut', // 使用更柔和的缓入缓出效果
      })
  }
}

// 12. 初始化动画函数（核心初始化逻辑）
const initAnimation = () => {
  if (!canvas.value || !canvas2.value) return

  // 初始化 Canvas 上下文
  ctx = canvas.value.getContext('2d')
  ctx2 = canvas2.value.getContext('2d')

  if (!ctx || !ctx2) return

  // 设置 Canvas 尺寸
  canvas.value.width = cw
  canvas.value.height = ch
  canvas2.value.width = cw
  canvas2.value.height = ch

  // 设置绘图样式
  ctx.fillStyle = ctx2.fillStyle = '#fff' // 填充颜色：白色
  ctx.strokeStyle = 'rgba(255,255,255,0.05)' // 描边颜色：半透明白色
  ctx.globalCompositeOperation = 'lighter' // 混合模式：变亮（叠加效果）

  // 初始化 GSAP 工具函数 - 创建鼠标位置平滑更新函数
  xTo = gsap.quickTo(m, 'x', { duration: 1.5, ease: 'expo' }) // x坐标平滑更新
  yTo = gsap.quickTo(m, 'y', { duration: 1.5, ease: 'expo' }) // y坐标平滑更新

  // 创建发光中心
  createLightCenters()

  // 创建动画元素
  const dot_num = 800 // 粒子数量
  for (let i = 0; i < dot_num; i++) {
    // 使得粒子分布随着椭圆半径越大而越多
    const temp_i = Math.floor(gsap.utils.mapRange(0, Math.sqrt(dot_num), 0, dot_num, Math.sqrt(i)))
    arr.push({
      i: i, // 粒子索引
      cx: cw / 2, // 中心点x坐标（Canvas水平中心）
      cy: gsap.utils.mapRange(0, dot_num, y_start, y_end - h_stump, temp_i), // 中心点y坐标：从600到3700线性分布
      r: gsap.utils.mapRange(0, dot_num, 3, max_radius, temp_i), // 椭圆半径：从3到770线性分布
      dot: 9, // 粒子基础半径
      prog: 0.25, // 初始进度（角度位置）
      s: 2, // 初始缩放因子
    })

    // 创建圣诞树粒子动画时间轴
    const d = 60 // 动画周期99秒
    if (i % 5 === 0) {
      arr_branch.push({
        i: i, // 粒子索引
        cx: cw / 2, // 中心点x坐标（Canvas水平中心）
        cy: gsap.utils.mapRange(0, dot_num, y_start, y_end, temp_i), // 中心点y坐标：从600到3700线性分布
        r: gsap.utils.mapRange(0, dot_num, 20, 80, temp_i), // 椭圆半径：从3到770线性分布
        dot: 20, // 粒子基础半径
        prog: 0.25, // 初始进度（角度位置）
        s: 1, // 初始缩放因子
      })

      arr_branch[i / 5].t = gsap
        .timeline({ repeat: -1 }) // 创建无限循环的时间轴
        // 第一段动画：旋转运动（控制粒子在椭圆轨迹上的位置）
        .to(arr_branch[i / 5], { duration: d, prog: '+=1', ease: 'linear' })
        .seek(Math.random() * d) // 随机起始位置，创造自然波浪效果
    }

    arr[i].t = gsap
      .timeline({ repeat: -1 }) // 创建无限循环的时间轴
      // 第一段动画：旋转运动（控制粒子在椭圆轨迹上的位置）
      .to(arr[i], { duration: d, prog: '+=1', ease: 'linear' })
      // 第二段动画：缩放运动（与旋转同时开始，创造闪烁效果）
      .to(arr[i], { duration: d / 2, s: 0.5, repeat: 1, yoyo: true, ease: 'slow' }, 0)
      .seek(Math.random() * d) // 随机起始位置，创造自然波浪效果

    // 创建雪花粒子对象
    arr2.push({
      x: cw * Math.random(), // 随机x坐标
      y: -9, // 初始y坐标（Canvas顶部上方）
      s: 3 + 5 * Math.random(), // 随机大小（3-8之间）
      a: 0.1 + 0.5 * Math.random(), // 随机透明度（0.1-0.6之间）
    })

    // 创建雪花下落动画
    arr2[i].t = gsap
      .to(arr2[i], { ease: 'none', y: ch, repeat: -1 }) // 线性下落，无限循环
      .seek(Math.random() * 99) // 随机起始位置
      .timeScale(arr2[i].s / 700) // 根据大小调整下落速度（大雪花快，小雪花慢）
  }

  // 添加事件监听器
  canvas.value.addEventListener('pointermove', handlePointerMove)

  // 启动动画
  render()

  // 开场动画 - 粒子从无到有弹出
  gsap.from(arr, { duration: 3, dot: 0, ease: 'back.out(9)', stagger: -0.0009 })
  gsap.from(arr_branch, { duration: 3, dot: 0, ease: 'back.out(9)', stagger: -0.0009 })
  // 开场动画 - 鼠标位置从底部滑入
  gsap.from(m, { duration: 3, y: ch * 1.2, ease: 'power2.inOut' })
}

// 11. 清理函数 - 组件卸载时调用
const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId) // 停止动画循环
    animationId = null
  }

  if (canvas.value) {
    canvas.value.removeEventListener('pointermove', handlePointerMove) // 移除事件监听
  }

  // 停止所有 GSAP 动画
  arr.forEach((item) => {
    if (item.t) item.t.kill() // 停止圣诞树粒子动画
  })
  arr2.forEach((item) => {
    if (item.t) item.t.kill() // 停止雪花粒子动画
  })
  lightCenters.forEach((center) => {
    if (center.t) center.t.kill() // 停止发光中心动画
  })
}

// 12. Vue生命周期钩子
onMounted(() => {
  initAnimation() // 组件挂载后初始化动画
})

onUnmounted(() => {
  cleanup() // 组件卸载时清理资源
})
</script>

<style scoped>
.fixed-bg {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
}

/* 确保 Canvas 覆盖整个屏幕 */
canvas:first-of-type {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
}

canvas:last-of-type {
  position: absolute;
  left: -10vw;
  width: 50%;
  height: auto;
}
</style>
