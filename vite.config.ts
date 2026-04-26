import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages ana dizini
  base: '/juri-puanlama-sistemi/',
  resolve: {
    alias: {
      // Projenin içindeki dosya yollarını düzeltir
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
