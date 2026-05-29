/** 管理端商品列表单项 */
export interface AdminGoodsListItem {
  _id: string
  title: string
  cover: string
  price: number
  stock: number
  sales: number
  /** 1 上架 / 0 下架 */
  status: number
  sort?: number
}

/** 分页列表请求参数 */
export interface AdminGoodsListParams {
  page?: number
  pageSize?: number
  keyword?: string
}

/** 分页列表响应 */
export interface AdminGoodsListData {
  list: AdminGoodsListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/** 更新商品状态 / 软删除 */
export interface UpdateGoodsStatusParams {
  goodsId: string
  action: 'status' | 'delete'
  /** action=status 时必填 */
  status?: 0 | 1
}

export interface UpdateGoodsStatusData {
  goodsId: string
  action: 'status' | 'delete'
  status?: number
  deleted?: boolean
}

/** 管理端商品详情（编辑表单） */
export interface AdminGoodsDetail {
  _id: string
  title: string
  subtitle?: string
  desc: string
  price: number
  originalPrice?: number
  stock: number
  category?: string
  age: string
  tags: string[]
  images: string[]
  cover: string
  status: number
  sort?: number
}

/** 保存商品入参 */
export interface SaveGoodsParams {
  goodsId?: string
  title: string
  subtitle?: string
  desc: string
  price: number
  originalPrice?: number
  stock: number
  category?: string
  age: string
  tags: string[]
  images: string[]
  cover: string
  status: 0 | 1
  sort?: number
}

export interface SaveGoodsData {
  goodsId: string
}
