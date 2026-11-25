import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localCurrencyApi } from './vite-api-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localCurrencyApi()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
