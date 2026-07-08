import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // three.js in its own chunk: it changes only when the dependency is
        // bumped, so returning users' service-worker cache keeps serving it
        // across app releases — every update downloads ~⅓ as much JS. It also
        // lets the browser fetch engine + app code in parallel on cold loads.
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
