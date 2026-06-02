import { computed, ref } from 'vue'

export interface PageLoadingBeginOptions {
  /** 不展示 UI（如下拉刷新、后台校验），仍计入 busy */
  silent?: boolean
}

const DEFAULT_MIN_DURATION = 280

/**
 * 页面级 loading：引用计数合并连续请求，最短展示时长避免闪烁。
 */
export function usePageLoading(options?: { minDuration?: number }) {
  const minDuration = options?.minDuration ?? DEFAULT_MIN_DURATION

  let uiRefCount = 0
  let busyRefCount = 0
  let showAt = 0
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const visible = ref(false)

  const loading = computed(() => visible.value)
  const busy = computed(() => busyRefCount > 0)

  function clearHideTimer() {
    if (hideTimer != null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function showUi() {
    clearHideTimer()
    visible.value = true
    showAt = Date.now()
  }

  function scheduleHideUi() {
    clearHideTimer()
    const elapsed = Date.now() - showAt
    const wait = Math.max(0, minDuration - elapsed)
    if (wait === 0) {
      visible.value = false
      return
    }
    hideTimer = setTimeout(() => {
      hideTimer = null
      if (uiRefCount === 0) {
        visible.value = false
      }
    }, wait)
  }

  function begin(opts?: PageLoadingBeginOptions) {
    busyRefCount++
    if (opts?.silent) {
      return
    }
    uiRefCount++
    if (uiRefCount === 1) {
      showUi()
    }
  }

  function end(opts?: PageLoadingBeginOptions) {
    busyRefCount = Math.max(0, busyRefCount - 1)
    if (opts?.silent) {
      return
    }
    uiRefCount = Math.max(0, uiRefCount - 1)
    if (uiRefCount === 0) {
      scheduleHideUi()
    }
  }

  async function run<T>(
    fn: () => Promise<T>,
    opts?: PageLoadingBeginOptions,
  ): Promise<T> {
    begin(opts)
    try {
      return await fn()
    }
    finally {
      end(opts)
    }
  }

  return {
    loading,
    busy,
    begin,
    end,
    run,
  }
}

export interface PagedRunResetOptions {
  silent?: boolean
  /** 已有列表数据时不展示全屏 loading（如下拉刷新） */
  hasData?: boolean
}

/**
 * 列表页：合并重置请求 + 独立 loadMore 状态。
 */
export function usePagedLoading(pageLoadingOptions?: { minDuration?: number }) {
  const pageLoading = usePageLoading(pageLoadingOptions)
  const loadingMore = ref(false)
  let seq = 0

  function nextSeq() {
    seq += 1
    return seq
  }

  function isCurrent(id: number) {
    return id === seq
  }

  async function runReset<T>(
    fn: (id: number) => Promise<T>,
    opts?: PagedRunResetOptions,
  ): Promise<T | undefined> {
    const id = nextSeq()
    const silent = opts?.silent === true && opts?.hasData === true
    pageLoading.begin({ silent })
    try {
      return await fn(id)
    }
    finally {
      if (isCurrent(id)) {
        pageLoading.end({ silent })
      }
    }
  }

  async function runMore<T>(
    fn: () => Promise<T>,
    canRun: () => boolean,
  ): Promise<T | undefined> {
    if (!canRun() || loadingMore.value) {
      return undefined
    }
    loadingMore.value = true
    try {
      return await fn()
    }
    finally {
      loadingMore.value = false
    }
  }

  return {
    pageLoading,
    loadingMore,
    nextSeq,
    isCurrent,
    runReset,
    runMore,
  }
}
