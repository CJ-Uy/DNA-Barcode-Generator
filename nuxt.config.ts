// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }],
    },
  },
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      autoSubfolderIndex: false,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
})
