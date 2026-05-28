/**
 * AI-Baby 商品集合 `goods` 数据结构说明（MongoDB / 微信云开发 JSON 文档）
 *
 * 字段含义：
 * - **title**：商品名称，列表与详情主标题。
 * - **desc**：短描述，用于列表摘要、卡片一行文案。
 * - **price**：单价（元），(NumberDecimal / number)。
 * - **cover**：主图 URL（云存储 fileID 或 HTTPS），列表首图兜底。
 * - **images**：详情轮播图 URL 数组，顺序即展示顺序；可为空则详情仅用 cover。
 * - **tags**：运营标签，如「热销」「有机」「无添加」；空数组表示无标签。
 * - **age**：推荐月龄展示文案，如「6月+」「6–12 月龄」，由运营录入。
 * - **nutrition**：营养特点说明（正文可为多段，前端可自行换行）。
 * - **ingredients**：配料 / 食材说明。
 * - **stock**：库存数量；≤0 可配合前端展示「补货中」或禁止下单。
 * - **createTime**：文档创建时间；MongoDB 建议 `Date`，导出 JSON 时常为 ISO 字符串。
 * - **storage**（可选）：保存方式说明；未建字段时详情页可由扩展字段或前端 mock 提供。
 *
 * 其它：
 * - `_id`：集合主键；云开发可由系统自动生成，导入示例时可省略由服务端生成。
 */

export interface GoodMongoDocument {
  /** 文档 ID（MongoDB ObjectId 在云开发中常为字符串） */
  _id?: string

  /** 商品标题 */
  title: string

  /** 简短描述（列表/卡片） */
  desc: string

  /** 单价（元） */
  price: number

  /** 封面图（列表主图） */
  cover: string

  /** 详情轮播图列表 */
  images: string[]

  /** 展示用标签 */
  tags: string[]

  /** 推荐月龄文案，如「6月+」 */
  age: string

  /** 营养说明 */
  nutrition: string

  /** 配料 / 食材说明 */
  ingredients: string

  /** 库存（件） */
  stock: number

  /** 创建时间 */
  createTime: Date | string

  /** 保存方式（可选，库中未录入时可省略） */
  storage?: string
}

/**
 * MongoDB Compass / mongo shell 可直接导入的示例文档（JSON）。
 * `createTime` 在 shell 中建议使用 `new Date()` 或 ISODate。
 */
export const GOODS_MONGO_JSON_EXAMPLE = `{
  "title": "有机高铁米粉 原味",
  "desc": "二价铁易吸收，粉质细腻好冲泡，适合初次添加辅食的宝宝。",
  "price": 39.9,
  "cover": "cloud://xxx.xxx/cover/mifen.jpg",
  "images": [
    "cloud://xxx.xxx/goods/mifen-1.jpg",
    "cloud://xxx.xxx/goods/mifen-2.jpg"
  ],
  "tags": ["有机", "高铁", "初尝辅食"],
  "age": "6月+",
  "nutrition": "强化钙铁锌；多种维生素；低钠配方，减轻肾脏负担。",
  "ingredients": "有机大米、二价铁、葡萄糖酸锌、碳酸钙、维生素 B1 等。",
  "stock": 200,
  "createTime": { "$date": "2026-05-10T08:00:00.000Z" }
}`

/** TypeScript 侧可用的示例对象（createTime 用 ISO 字符串示意） */
export const GOODS_DOCUMENT_EXAMPLE: GoodMongoDocument = {
  title: '有机高铁米粉 原味',
  desc: '二价铁易吸收，粉质细腻好冲泡，适合初次添加辅食的宝宝。',
  price: 39.9,
  cover: 'cloud://xxx.xxx/cover/mifen.jpg',
  images: [
    'cloud://xxx.xxx/goods/mifen-1.jpg',
    'cloud://xxx.xxx/goods/mifen-2.jpg',
  ],
  tags: ['有机', '高铁', '初尝辅食'],
  age: '6月+',
  nutrition:
    '强化钙铁锌；多种维生素；低钠配方，减轻肾脏负担。',
  ingredients:
    '有机大米、二价铁、葡萄糖酸锌、碳酸钙、维生素 B1 等。',
  stock: 200,
  createTime: '2026-05-10T08:00:00.000Z',
}
