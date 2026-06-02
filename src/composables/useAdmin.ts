import { onLoad } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useAdminStore } from '@/stores/admin'

export interface UseAdminOptions {
  /** 是否在 onLoad 时校验权限并拦截非管理员，默认 true */
  pageGuard?: boolean
}

/**
 * 管理端 composable：读取管理员状态、刷新校验、页面权限守卫。
 */
export function useAdmin(options: UseAdminOptions = {}) {
  const pageGuard = options.pageGuard !== false

  const adminStore = useAdminStore()
  const { isAdmin, loading, adminName, checked } = storeToRefs(adminStore)

  const ready = ref(false)

  async function refresh(): Promise<boolean> {
    return adminStore.fetchAdminStatus()
  }

  async function ensureAdmin(): Promise<boolean> {
    if (checked.value) {
      return isAdmin.value
    }
    return adminStore.fetchAdminStatus()
  }

  function redirectHome() {
    uni.showToast({ title: '无管理员权限', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index',
        fail() {
          uni.reLaunch({ url: '/pages/index/index' })
        },
      })
    }, 400)
  }

  if (pageGuard) {
    onLoad(() => {
      void (async () => {
        const ok = await ensureAdmin()
        ready.value = true
        if (!ok) {
          redirectHome()
        }
      })()
    })
  }

  const canAccess = computed(() => ready.value && isAdmin.value)
  /** 权限校验完成前展示 loading，避免 iOS 上出现空白页 */
  const guardPending = computed(() => pageGuard && !ready.value)
  const showAuthLoading = computed(
    () => guardPending.value || (loading.value && !canAccess.value),
  )

  return {
    isAdmin,
    loading,
    adminName,
    ready,
    canAccess,
    showAuthLoading,
    refresh,
    ensureAdmin,
    redirectHome,
  }
}
