import type { AdminCloudResponse } from '@/types/admin'

/** 管理端云函数（code / message / data） */
export function callAdminCloud<T>(
  name: string,
  data?: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.callFunction({
      name,
      data: data ?? {},
      success(res) {
        const result = res.result as AdminCloudResponse<T> | undefined
        if (result?.code === 0) {
          resolve(result.data as T)
          return
        }
        reject(new Error(result?.message ?? '请求失败'))
      },
      fail(err) {
        reject(err)
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序云开发'))
    // #endif
  })
}

/** 用户端云函数（success / data 格式） */
export function callUserCloud<T>(
  name: string,
  data?: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.callFunction({
      name,
      data: data ?? {},
      success(res) {
        const result = res.result as { success?: boolean, data?: T, message?: string }
        if (result?.success) {
          resolve(result.data as T)
          return
        }
        reject(new Error(result?.message ?? '请求失败'))
      },
      fail(err) {
        reject(err)
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('仅支持微信小程序云开发'))
    // #endif
  })
}
