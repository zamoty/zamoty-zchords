// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],

  ssr: false,

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? ''
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  /* @nuxt/fonts is auto-registered by Nuxt UI; configure families & weights */
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Rubik', provider: 'google', weights: [500, 600, 700] },
      { name: 'Manrope', provider: 'google', weights: [400, 500, 600, 700] }
    ]
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ZChords',
      short_name: 'ZChords',
      lang: 'pt-BR',
      description: 'Biblioteca de cifras offline para palco.',
      display: 'standalone',
      theme_color: '#14b8a6',
      background_color: '#ffffff',
      start_url: '/songs',
      share_target: {
        action: '/import/share',
        method: 'GET',
        enctype: 'application/x-www-form-urlencoded',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      icons: [
        {
          src: '/z-favicon.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/songs',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.destination === 'document',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            networkTimeoutSeconds: 3
          }
        },
        {
          urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'assets-cache'
          }
        },
        {
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        }
      ]
    }
  }
})
