import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
  build: {
    outDir: 'dist',
  },
  plugins: [react()],
})
