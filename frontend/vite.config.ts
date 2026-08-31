import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    envDir: path.resolve(__dirname, '..'),
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@frontend': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (
                id.includes('react') || id.includes('react-dom') ||
                id.includes('react-router') || id.includes('scheduler') ||
                id.includes('@apollo') || id.includes('graphql') ||
                id.includes('zen-observable') || id.includes('symbol-observable') ||
                id.includes('motion') || id.includes('lucide-react') ||
                id.includes('date-fns') || id.includes('clsx') ||
                id.includes('tailwind-merge') || id.includes('sonner') ||
                id.includes('tw-animate') || id.includes('class-variance')
              ) {
                return 'vendor-core';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
