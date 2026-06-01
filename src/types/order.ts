import type { UserOrderStatusCode } from '@/utils/order-status'

export interface UserOrderGoodsLine {
  title: string
  cover?: string
  count: number
}

/** 用户端订单列表项 */
export interface UserOrderRecord {
  id: string
  status: UserOrderStatusCode
  totalPrice: number
  createTime: string
  goodsList: UserOrderGoodsLine[]
}

export interface UserOrderListParams {
  page?: number
  pageSize?: number
  /** all 或状态码字符串 */
  status?: string
}

export interface UserOrderListData {
  list: UserOrderRecord[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}
