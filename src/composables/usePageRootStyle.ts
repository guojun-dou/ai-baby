import { storeToRefs } from 'pinia'

import { useLayoutStore } from '@/stores/layout'

/** 绑定到根节点 <view class="page" :style="pageRootStyle"> */
export function usePageRootStyle() {
  const layoutStore = useLayoutStore()
  const { pageRootStyle } = storeToRefs(layoutStore)
  return { pageRootStyle }
}
