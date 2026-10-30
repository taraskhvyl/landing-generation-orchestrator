import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const api = `http://127.0.0.1:${env.API_PORT ?? 8790}`;
  return {
    root: 'web',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': api, '/out': api },
    },
  };
});
