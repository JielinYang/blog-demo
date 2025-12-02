/// <reference types="vite/client" />

// 声明LiquidBackground模块
declare module '../assets/js/threejs-components/liquid1.min.js' {
  const LiquidBackground: (canvas: HTMLCanvasElement) => any
  export default LiquidBackground
}

declare module '@/assets/js/threejs-components/liquid1.min.js' {
  const LiquidBackground: (canvas: HTMLCanvasElement) => any
  export default LiquidBackground
}
