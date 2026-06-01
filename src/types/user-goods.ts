import type { GoodItem } from '@/types/goods'

export type UserGoodsSortBy = 'sort' | 'createTime' | 'price' | 'sales'

export type UserGoodsSortOrder = 'asc' | 'desc'

export interface UserGoodsListParams {
  page?: number
  pageSize?: number
  keyword?: string
  sortBy?: UserGoodsSortBy
  sortOrder?: UserGoodsSortOrder
}

export interface UserGoodsListData {
  list: GoodItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/** 购物车校验：在售商品快照 */
export interface CartGoodsCheckItem {
  _id: string
  onSale: boolean
  title: string
  price: number
  cover: string
  stock: number
}

export interface CartGoodsCheckData {
  items: CartGoodsCheckItem[]
}
