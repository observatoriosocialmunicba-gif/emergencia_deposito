import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Emergencias Muni Cba',
        short_name: 'Emergencias',
        description: 'Gestión de pedidos de emergencia',
        lang: 'es-AR',
        theme_color: '#00058D',
        background_color: '#F1F4F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/Icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/Icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/Icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
