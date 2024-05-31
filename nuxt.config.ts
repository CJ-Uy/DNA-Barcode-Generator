// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  mode: "static",
  router: {
    base: "/DNA-Barcode-Generator/",
  },
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
});