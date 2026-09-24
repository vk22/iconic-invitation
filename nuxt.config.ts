// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  },

  runtimeConfig: {
    databaseUrl: '',
    adminPassword: '',
    sessionSecret: '',
    public: {
      eventTimezone: 'Asia/Dubai'
    }
  },

  typescript: {
    strict: true
  }
})
