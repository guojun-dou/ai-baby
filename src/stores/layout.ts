import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getStatusBarHeightPx } from '@/utils/system-layout'

/** 全站布局：状态栏高度 → 各页根节点 .page 内联 CSS 变量（小程序 App.vue 无法挂 page-meta） */
export const useLayoutStore = defineStore('layout', () => {
  const statusBarHeight = ref(0)

  const pageRootStyle = computed(() => ({
    '--status-bar-height': `${statusBarHeight.value}px`,
  }))

  function initFromSystem() {
    statusBarHeight.value = getStatusBarHeightPx()

    // #ifdef H5
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--status-bar-height',
        `${statusBarHeight.value}px`,
      )
    }
    // #endif
  }

  return {
    statusBarHeight,
    pageRootStyle,
    initFromSystem,
  }
})
