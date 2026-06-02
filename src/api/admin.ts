import type { AdminCheckData, DashboardData } from '@/types/admin'

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

/** 管理端首页统计数据 */
export async function getDashboardData(): Promise<DashboardData> {
  const data = await callAdminCloud<DashboardData>('admin-dashboard')
  return {
    todayOrderCount: Math.floor(Number(data?.todayOrderCount) || 0),
    deliveryCount: Math.floor(Number(data?.deliveryCount) || 0),
    goodsCount: Math.floor(Number(data?.goodsCount) || 0),
  }
}
