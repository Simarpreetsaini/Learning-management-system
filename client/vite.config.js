import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    // Disable React's double rendering in development
    fastRefresh: false
  })],
  server: {
    host: '0.0.0.0', // Allow access from any IP address
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.7:3000', // Use your system's IP address
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://192.168.1.7:3000', // Proxy uploads to backend server
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
