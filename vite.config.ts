import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/juri-puanlama-sistemi/', // BURAYI EKLEYİN (Deponuzun adıyla aynı olmalı)
  plugins: [react()],
  // ... diğer ayarlarınız kalabilir
});
