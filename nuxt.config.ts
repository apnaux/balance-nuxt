// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'balancé',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  fonts: {
    families: [
      {
        name: 'Space Grotesk',
        provider: 'local',
        src: '/fonts/SpaceGrotesk-Variable.ttf',
        weight: '300 700',
        style: 'normal',
        display: 'swap'
      }
    ]
  }
})