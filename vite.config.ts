import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages için sitenizin klasör yolu
  base: '/juri-puanlama-sistemi/',
  resolve: {
    alias: {
      // Proje içindeki @ işaretinin src klasörünü görmesini sağlar
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
