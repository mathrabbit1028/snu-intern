import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api-internhasha.wafflestudio.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
