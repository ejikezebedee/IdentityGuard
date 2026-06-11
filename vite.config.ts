import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const host = process.env.IDENTITYGUARD_DEV_HOST || '127.0.0.1';

  return {
    server: {
      port: 3000,
      host,
    },
    preview: {
      host,
      port: 4173,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
