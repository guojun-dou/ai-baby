import { fileURLToPath, URL } from 'node:url'

import ComponentPlaceholder from '@binbinji/vite-plugin-component-placeholder'
import Uni from '@uni-helper/plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
          @import "@/styles/icons.scss";
        `,
      },
    },
  },
  plugins: [
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: [],
    }),
    // https://uni-helper.js.org/vite-plugin-uni-pages
    UniPages(),
    // https://uni-helper.js.org/vite-plugin-uni-manifest
    UniManifest(),
    // https://uni-helper.js.org/vite-plugin-uni-platform
    UniPlatform(),
    // https://github.com/chouchouji/vite-plugin-component-placeholder
    ComponentPlaceholder(),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
  ],
  build: {
    target: 'es6',
    cssTarget: 'chrome61',
    minify: 'terser',
  },
  optimizeDeps: {
    exclude: ['vue-demi'],
  },
})
