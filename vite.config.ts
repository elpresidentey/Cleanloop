import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/Cleanloop/' : '/',
  server: {
    port: 5173,
    host: true, // Allow external connections
    open: true, // Automatically open browser
  },
})
