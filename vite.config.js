import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon.svg', 'icons/maskable.svg'],
            manifest: {
                name: 'GameVault',
                short_name: 'GameVault',
                description: 'Offline-first video game and DLC library manager',
                theme_color: '#1f2937',
                background_color: '#111827',
                display: 'standalone',
                start_url: '/',
                icons: [
                    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
                    { src: 'icons/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
            }
        })
    ]
});
