import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'https://screen.advaitdigital.co.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
