import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import Components from '@uni-helper/vite-plugin-uni-components'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'
import ComponentPlaceholder from '@binbinji/vite-plugin-component-placeholder'
import Uni from '@uni-helper/plugin-uni'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: []
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
    target: "es6",
    cssTarget: "chrome61"
  },
  optimizeDeps: {
    exclude: [
      "vue-demi"
    ]
  }  
})


