import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['5173-io471clzekza1qcldtndg-1cdee1e0.manusvm.computer'],
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});
