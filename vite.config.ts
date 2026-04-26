import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages için gerekli ana dizin ayarı
  base: '/juri-puanlama-sistemi/',
  resolve: {
    alias: {
      // Projenin @ simgesini src klasörü olarak görmesini sağlar
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
