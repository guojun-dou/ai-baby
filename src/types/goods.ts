import type { GoodMongoDocument } from './goods-mongo'

/**
 * 列表 / 购物车 / 云函数返回的统一商品形状：
 * Mongo `goods` 文档字段（Partial）+ 旧版前端别名。
 */
export type GoodItem = Partial<GoodMongoDocument> & {
  id?: string
  name?: string
  image?: string
  imgUrl?: string
  description?: string
  summary?: string
  month_label?: string
  monthAge?: string | number
  ageMonths?: number
}

/** 详情页：与列表同源 + 扩展文案别名（`storage` 见 `GoodMongoDocument`） */
export type GoodDetail = GoodItem & {
  ingredient_desc?: string
  nutrition_desc?: string
  storage_desc?: string
}
