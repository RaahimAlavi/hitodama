import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'three-legacy-encoding-shim',
      transform(code, id) {
        if (id.replace(/\\/g, '/').includes('node_modules/three/build/three.module.js')) {
          return {
            code: `${code}\nexport const sRGBEncoding = 3001;\nexport const LinearEncoding = 3000;\n`,
            map: null,
          };
        }
      },
    },
  ],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});