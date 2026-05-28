import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 用户信息（可按微信 getUserProfile / 后端登录扩展字段） */
export interface UserInfo {
  nickName?: string
  avatarUrl?: string
  openid?: string
  phone?: string
  [key: string]: unknown
}

const TOKEN_KEY = 'user_token'
const USER_INFO_KEY = 'user_info'

function loadSession(): { token: string, userInfo: UserInfo | null } {
  try {
    const t = uni.getStorageSync(TOKEN_KEY)
    const u = uni.getStorageSync(USER_INFO_KEY)
    const token = typeof t === 'string' ? t : ''
    let userInfo: UserInfo | null = null
    if (u !== '' && u !== null && u !== undefined && typeof u === 'object') {
      userInfo = u as UserInfo
    }
    return { token, userInfo }
  }
  catch {
    return { token: '', userInfo: null }
  }
}

/** 兼容早期仅在本地写入 user_profile 的页面 */
function tryMigrateLegacyProfile(): UserInfo | null {
  try {
    const legacy = uni.getStorageSync('user_profile')
    if (legacy !== '' && legacy !== null && legacy !== undefined && typeof legacy === 'object') {
      const o = legacy as Record<string, unknown>
      const nick = o.nickName != null ? String(o.nickName) : ''
      const avatar = o.avatarUrl != null ? String(o.avatarUrl) : ''
      if (nick || avatar) {
        return {
          nickName: nick,
          avatarUrl: avatar,
        }
      }
    }
  }
  catch {
    /* ignore */
  }
  return null
}

export const useUserStore = defineStore('user', () => {
  const session = loadSession()
  const token = ref(session.token)
  const userInfo = ref<UserInfo | null>(session.userInfo)

  function persist() {
    try {
      uni.setStorageSync(TOKEN_KEY, token.value)
      if (userInfo.value === null || userInfo.value === undefined) {
        uni.removeStorageSync(USER_INFO_KEY)
      }
      else {
        uni.setStorageSync(USER_INFO_KEY, userInfo.value)
      }
    }
    catch (e) {
      console.error(e)
    }
  }

  if (!userInfo.value) {
    const migrated = tryMigrateLegacyProfile()
    if (migrated) {
      userInfo.value = migrated
      persist()
    }
  }

  const isLoggedIn = computed(() => Boolean(token.value && String(token.value).trim()))

  /**
   * 登录：写入 token 与用户信息并持久化
   */
  function login(payload: { token: string, userInfo?: UserInfo | null }) {
    token.value = String(payload.token ?? '').trim()
    userInfo.value = payload.userInfo ?? null
    persist()
  }

  /**
   * 退出登录：清空 token 与用户信息
   */
  function logout() {
    token.value = ''
    userInfo.value = null
    persist()
  }

  /**
   * 更新用户信息（不改变登录态）
   */
  function setUserInfo(partial: Partial<UserInfo>) {
    userInfo.value = {
      ...(userInfo.value ?? {}),
      ...partial,
    }
    persist()
  }

  /** 从 Storage 重新读取（多入口写入缓存时） */
  function hydrateFromStorage() {
    const s = loadSession()
    token.value = s.token
    userInfo.value = s.userInfo
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    login,
    logout,
    setUserInfo,
    hydrateFromStorage,
  }
})
