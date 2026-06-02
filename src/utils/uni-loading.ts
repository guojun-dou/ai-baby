/** 合并连续 uni.showLoading，避免闪烁 */
let refCount = 0
let currentTitle = '加载中…'

export function showUniLoading(title = '加载中…') {
  refCount++
  if (refCount === 1) {
    currentTitle = title
    uni.showLoading({ title, mask: true })
  }
}

export function hideUniLoading() {
  refCount = Math.max(0, refCount - 1)
  if (refCount === 0) {
    uni.hideLoading()
  }
}

export async function withUniLoading<T>(
  fn: () => Promise<T>,
  title = '加载中…',
): Promise<T> {
  showUniLoading(title)
  try {
    return await fn()
  }
  finally {
    hideUniLoading()
  }
}
