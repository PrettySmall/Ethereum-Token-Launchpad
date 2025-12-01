import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react()
  ],
  server: {
    port: 5173
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  }
})
