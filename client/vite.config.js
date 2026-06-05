import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/config': 'http://localhost:3000',
      '/analyze': 'http://localhost:3000',
    },
  },
})
