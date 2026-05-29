import type { AdminCheckData } from '@/types/admin'

import { callAdminCloud } from '@/api/cloud'

/** 校验当前用户是否为管理员 */
export async function checkAdmin(): Promise<AdminCheckData> {
  const data = await callAdminCloud<AdminCheckData>('admin-check')
  return {
    isAdmin: Boolean(data?.isAdmin),
    name: data?.name,
    openid: data?.openid,
  }
}
