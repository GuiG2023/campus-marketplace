import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// vite.config.js
// Vite configuration for the frontend dev server.
//
// Modified by: Guiran Liu
// Reason: Added proxy to forward /api requests to the FastAPI backend (port 8000)
// during local development. This allows the frontend (port 5173) to communicate
// with the backend without CORS issues. This proxy only applies in dev mode
// and does not affect the production deployment on EC2.

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})