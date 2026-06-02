import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { checkAdmin } from '@/api/admin'

const ADMIN_CACHE_KEY = 'admin_is_admin'

function loadCachedAdmin(): boolean {
  try {
    return uni.getStorageSync(ADMIN_CACHE_KEY) === true
  }
  catch {
    return false
  }
}

export const useAdminStore = defineStore('admin', () => {
  const isAdmin = ref(loadCachedAdmin())
  const adminName = ref('')
  const loading = ref(false)
  const checked = ref(false)

  const canShowAdminEntry = computed(() => isAdmin.value)

  function persistCache() {
    try {
      uni.setStorageSync(ADMIN_CACHE_KEY, isAdmin.value)
    }
    catch (e) {
      console.error(e)
    }
  }

  let fetchRefCount = 0

  /** 调用 admin-check 云函数并更新状态 */
  async function fetchAdminStatus(): Promise<boolean> {
    fetchRefCount++
    loading.value = true
    try {
      const data = await checkAdmin()
      isAdmin.value = data.isAdmin
      adminName.value = data.name ?? ''
      persistCache()
      return data.isAdmin
    }
    catch (e) {
      console.error(e)
      isAdmin.value = false
      adminName.value = ''
      persistCache()
      return false
    }
    finally {
      fetchRefCount = Math.max(0, fetchRefCount - 1)
      checked.value = true
      loading.value = fetchRefCount > 0
    }
  }

  function resetAdmin() {
    isAdmin.value = false
    adminName.value = ''
    checked.value = false
    persistCache()
  }

  return {
    isAdmin,
    adminName,
    loading,
    checked,
    canShowAdminEntry,
    fetchAdminStatus,
    resetAdmin,
  }
})
