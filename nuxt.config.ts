// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }],
    },
  },
  devtools: { enabled: true },
  colorMode: { preference: 'light' },
  modules: ['@nuxt/ui', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide'],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['html2canvas'],
    },
  },
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      nodeCompat: true,
    },
  },
})
