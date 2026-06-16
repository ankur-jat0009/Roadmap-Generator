import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      plugins: [react()],
      server: {
        port: 5174,
        strictPort: true,
        hmr: {
          overlay: false,
          timeout: 30000,
        },
        watch: {
          usePolling: true,
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
