import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masjid-logo.svg'],
      manifest: {
        name: 'Masjid Mehmoodiya – Sawangi',
        short_name: 'Masjid Mehmoodiya',
        description: 'Official digital platform for Masjid Mehmoodiya – Sawangi, Chhatrapati Sambhajinagar',
        theme_color: '#075B3A',
        background_color: '#F8FAF8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'masjid-logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
