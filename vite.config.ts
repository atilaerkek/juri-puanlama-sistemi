import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// GitHub Pages ve Supabase bağlantısı için optimize edilmiş tam kod
export default defineConfig({
  plugins: [react()],
  // Sitenin GitHub üzerindeki klasör yolu (Siyah ekranı çözen satır)
  base: '/juri-puanlama-sistemi/',
  resolve: {
    alias: {
      // Proje içindeki @ sembolünün src klasörünü bulmasını sağlar
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Çıktı klasörü ayarı
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  }
})
