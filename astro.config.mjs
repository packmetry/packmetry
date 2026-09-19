import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  vite: {
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/test/setup.ts']
    }
  }
});