/** 读取系统状态栏高度（px），供 layout store 与 common.scss 变量对齐 */

export function getStatusBarHeightPx(): number {
  try {
    const sys = uni.getSystemInfoSync()
    const h = sys.statusBarHeight
    return typeof h === 'number' && !Number.isNaN(h) ? h : 0
  }
  catch {
    return 0
  }
}
