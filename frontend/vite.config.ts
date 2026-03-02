import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  // Use root path for preview/testing, subdirectory for production deployment
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/edschool/' : '/'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'EdSchool - School Management System',
        short_name: 'EdSchool',
        description: 'Comprehensive multi-tenant school management system for students, teachers, and parents',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: process.env.NODE_ENV === 'production' ? '/edschool/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/edschool/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['education', 'productivity'],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your dashboard',
            url: process.env.NODE_ENV === 'production' ? '/edschool/app/dashboard' : '/app/dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Attendance',
            short_name: 'Attendance',
            description: 'Mark attendance',
            url: process.env.NODE_ENV === 'production' ? '/edschool/app/attendance' : '/app/attendance',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/edschool/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/edschool/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
    },
  },
});
