import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Appwrite already ships a browser-ready ESM bundle. Excluding it avoids a
  // broken Vite dependency-cache artifact during local development on Windows.
  optimizeDeps: {
    exclude: ['appwrite']
  }
});
