import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Depo adınız juri-puanlama-sistemi olduğu için bu yol zorunludur
  base: '/juri-puanlama-sistemi/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
