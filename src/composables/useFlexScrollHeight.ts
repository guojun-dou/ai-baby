import { computed, onMounted, ref } from 'vue'

export interface FlexScrollHeightOptions {
  /** 从 windowHeight 减去的顶部高度（rpx），含自定义 header/tabs */
  topOffsetRpx?: number
  /** 从 windowHeight 减去的底部高度（rpx），含 tabBar / 固定底栏 */
  bottomOffsetRpx?: number
  /** 最小高度（px），防止极端小屏为 0 */
  minHeightPx?: number
}

/**
 * 为 flex 布局内的 scroll-view 计算明确高度。
 * iOS 微信小程序中 scroll-view 仅 flex:1 + height:0 会塌陷为空白。
 */
export function useFlexScrollHeight(options: FlexScrollHeightOptions = {}) {
  const heightPx = ref(480)

  function refreshHeight() {
    try {
      const sys = uni.getSystemInfoSync()
      const windowHeight = sys.windowHeight ?? 667
      const top = uni.upx2px(options.topOffsetRpx ?? 0)
      const bottom = uni.upx2px(options.bottomOffsetRpx ?? 0)
      const minH = options.minHeightPx ?? 240
      heightPx.value = Math.max(minH, windowHeight - top - bottom)
    }
    catch (e) {
      console.error(e)
      heightPx.value = 500
    }
  }

  onMounted(() => {
    refreshHeight()
  })

  const scrollStyle = computed(() => ({
    height: `${heightPx.value}px`,
    width: '100%',
  }))

  return {
    scrollStyle,
    refreshHeight,
  }
}
