import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: {
    allowedHosts: ['web-production-416351.up.railway.app'],
  },
})
