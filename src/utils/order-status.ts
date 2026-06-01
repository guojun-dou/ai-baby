/** 用户端订单状态（与管理端 0-4 对齐） */
export type UserOrderStatusCode = 0 | 1 | 2 | 3 | 4

export const USER_ORDER_STATUS_LABEL: Record<UserOrderStatusCode, string> = {
  0: '待付款',
  1: '待配送',
  2: '配送中',
  3: '已完成',
  4: '已取消',
}

export const USER_ORDER_STATUS_COLOR: Record<UserOrderStatusCode, string> = {
  0: '#ff8ba7',
  1: '#ffb703',
  2: '#219ebc',
  3: '#999999',
  4: '#cccccc',
}

export type UserOrderStatusFilter = 'all' | `${UserOrderStatusCode}`

/** 库内 status → 用户端状态码 */
export function normalizeUserOrderStatus(raw: unknown): UserOrderStatusCode {
  if (raw === 0 || raw === '0') {
    return 0
  }
  if (raw === 1 || raw === '1' || raw === 'pending') {
    return 1
  }
  if (raw === 2 || raw === '2' || raw === 'delivering') {
    return 2
  }
  if (raw === 3 || raw === '3' || raw === 'completed') {
    return 3
  }
  if (raw === 4 || raw === '4' || raw === 'cancelled' || raw === 'canceled') {
    return 4
  }
  return 1
}

/** 筛选 Tab → 数据库可能值 */
export function userStatusFilterToDbValues(
  filter: UserOrderStatusFilter,
): Array<number | string> | null {
  if (filter === 'all') {
    return null
  }
  const code = normalizeUserOrderStatus(Number(filter))
  switch (code) {
    case 0:
      return [0, '0']
    case 1:
      return [1, '1', 'pending']
    case 2:
      return [2, '2', 'delivering']
    case 3:
      return [3, '3', 'completed']
    case 4:
      return [4, '4', 'cancelled', 'canceled']
    default:
      return [1, '1', 'pending']
  }
}
