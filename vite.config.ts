import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor code splitting
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['lucide-react'],
          'utils-vendor': ['jspdf', 'xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Aumentar limite de aviso para 1MB
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'robots.txt',
        'sitemap.xml',
        'icons/*.svg',
        'icons/*.png'
      ],
      manifest: {
        name: 'Clinify - Gestão Estética Inteligente',
        short_name: 'Clinify',
        description: 'Sistema completo de gestão financeira e CRM para clínicas de estética.',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        id: '/',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['business', 'finance', 'medical', 'productivity'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Nova Transação',
            short_name: 'Transação',
            description: 'Adicionar nova receita ou despesa',
            url: '/?action=new-transaction',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Novo Agendamento',
            short_name: 'Agendar',
            description: 'Criar novo agendamento',
            url: '/?action=new-appointment',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Arquivos a serem cacheados no build
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'
        ],
        
        // Aumentar limite de tamanho de arquivo para precache (padrão é 2MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Limpar caches antigos automaticamente
        cleanupOutdatedCaches: true,
        
        // Ignorar parâmetros de URL para cache
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
        
        // Estratégias de cache em runtime
        runtimeCaching: [
          // Cache de fontes do Google (CacheFirst - raramente mudam)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache de avatares (StaleWhileRevalidate - mostra cache enquanto atualiza)
          {
            urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'avatar-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache de imagens (CacheFirst com fallback)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache da API do Supabase (NetworkFirst - prioriza dados frescos)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache de CDNs externos (CacheFirst)
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-cdn',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache de scripts ESM (StaleWhileRevalidate)
          {
            urlPattern: /^https:\/\/(esm\.sh|aistudiocdn\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'esm-modules',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Cache da API ViaCEP (CacheFirst - CEPs não mudam)
          {
            urlPattern: /^https:\/\/viacep\.com\.br\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'viacep-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // Navegação offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/_/
        ]
      },
      
      // Configurações de desenvolvimento
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
})
