/** 管理端订单商品行 */
export interface AdminOrderGoodsLine {
  title: string
  price: number
  count: number
  cover?: string
}

/** 管理端订单详情 */
export interface AdminOrderDetail {
  _id: string
  username: string
  phone: string
  address: string
  remark: string
  deliveryTime: string
  goodsList: AdminOrderGoodsLine[]
  totalPrice: number
  status: AdminOrderStatusCode
  createTime: string
  updateTime: string
}

/** 更新订单状态入参 */
export interface UpdateOrderStatusParams {
  orderId: string
  status: AdminOrderStatusCode
}

export interface UpdateOrderStatusData {
  orderId: string
  status: AdminOrderStatusCode
}

/** 管理端订单状态码（与 PROMPTS_ADMIN 一致） */
export type AdminOrderStatusCode = 0 | 1 | 2 | 3 | 4

export const ADMIN_ORDER_STATUS_LABEL: Record<AdminOrderStatusCode, string> = {
  0: '待付款',
  1: '待制作',
  2: '配送中',
  3: '已完成',
  4: '已取消',
}

export const ADMIN_ORDER_STATUS_COLOR: Record<AdminOrderStatusCode, string> = {
  0: '#ff8ba7',
  1: '#ffb703',
  2: '#219ebc',
  3: '#52b788',
  4: '#999999',
}

/** 详情页可操作的下一状态（不含待付款） */
export const ADMIN_ORDER_ACTION_STATUSES: AdminOrderStatusCode[] = [1, 2, 3, 4]

/** 列表筛选项：all 或状态码 */
export type AdminOrderStatusFilter = 'all' | `${AdminOrderStatusCode}`

/** 订单日期筛选 */
export type AdminOrderDateFilter = 'all' | 'today'

/** 管理端订单列表单项 */
export interface AdminOrderListItem {
  _id: string
  phone: string
  address: string
  goodsCount: number
  totalPrice: number
  status: AdminOrderStatusCode
  createTime: string
}

export interface AdminOrderListParams {
  page?: number
  pageSize?: number
  status?: AdminOrderStatusFilter
  /** today：仅今日创建的订单 */
  dateFilter?: AdminOrderDateFilter
}

export interface AdminOrderListData {
  list: AdminOrderListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/** 将库内 status（数字或旧字符串）规范为管理端状态码 */
export function normalizeAdminOrderStatus(raw: unknown): AdminOrderStatusCode {
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

/** 状态码 -> 数据库可能存在的 status 值（筛选兼容旧数据） */
export function adminStatusCodeToDbValues(code: AdminOrderStatusCode): Array<number | string> {
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

/**
 * 校验状态流转是否合法
 * 待付款→待制作；待制作→配送中；配送中→已完成；任意→已取消
 */
export function canAdminOrderTransition(
  from: AdminOrderStatusCode,
  to: AdminOrderStatusCode,
): boolean {
  if (from === to) {
    return false
  }
  if (to === 4) {
    return from !== 4
  }
  if (from === 4) {
    return false
  }
  if (from === 3) {
    return false
  }
  const forward: Partial<Record<AdminOrderStatusCode, AdminOrderStatusCode>> = {
    0: 1,
    1: 2,
    2: 3,
  }
  return forward[from] === to
}

/** 当前状态可执行的操作按钮（目标状态列表） */
export function getAdminOrderNextStatuses(
  current: AdminOrderStatusCode,
): AdminOrderStatusCode[] {
  const actions: AdminOrderStatusCode[] = []
  if (canAdminOrderTransition(current, 1)) {
    actions.push(1)
  }
  if (canAdminOrderTransition(current, 2)) {
    actions.push(2)
  }
  if (canAdminOrderTransition(current, 3)) {
    actions.push(3)
  }
  if (canAdminOrderTransition(current, 4)) {
    actions.push(4)
  }
  return actions
}
