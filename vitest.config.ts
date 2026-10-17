import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Match the build-time global in vite.config.ts so modules referencing it
  // (src/api/version.ts) don't throw at import time in tests.
  define: {
    __APP_BUILD_ID__: JSON.stringify('test-build'),
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __NODE_VERSION__: JSON.stringify(process.version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
