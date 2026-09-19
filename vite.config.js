import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드 후보 — 사용할 것만 활성화하세요 (한 줄만 주석 해제).
//const API_TARGET = 'http://127.0.0.1:5015'                  // 로컬 개발
const API_TARGET = 'https://clublog-api.nareumyouth.kr'  // 시놀로지 배포

// https://vite.dev/config/
// Tailwind v3 는 PostCSS 기반으로 동작 -> 여기 따로 import 불필요.
//   PostCSS 설정은 postcss.config.js 에서 처리.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 개발 중 /api/* 요청을 Flask 백엔드로 전달.
      // 브라우저는 same-origin 으로 인식 -> 세션 쿠키 자연스럽게 전달.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
