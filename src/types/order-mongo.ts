/**
 * AI-Baby 订单集合 `orders` 数据结构说明（MongoDB / 微信云开发 JSON 文档）
 *
 * 字段含义：
 * - **openid**：微信用户标识；列表查询按 `openid` 过滤，保证用户只能看到自己订单。
 * - **goodsList**：下单时的商品行快照（名称、单价、数量、封面等），与当前商品库可能不一致，以订单内为准。
 * - **totalPrice**：订单应付合计（元），应与各行 `price * count` 之和一致（允许极小浮点误差由服务端校验）。
 * - **username**：收货人姓名。
 * - **phone**：收货手机号（大陆可约束 11 位）。
 * - **address**：完整收货地址。
 * - **remark**：用户备注（空字符串表示无备注）。
 * - **deliveryTime**：期望配送时段文案（如「尽快送达」），由前端选项写入。
 * - **status**：订单状态；与列表页、云函数约定一致。
 * - **createTime**：下单时间；MongoDB 建议 `Date`，导出 JSON 时常为 ISO 字符串或 `{ "$date": "..." }`。
 * - **updateTime**：最后更新时间（改状态、发货、取消等）；新建订单可与 `createTime` 相同或由服务端写入。
 *
 * 云函数 `cloudfunctions/orders` 的**写入与字段命名**已与本文档一致；`create` 入参仍兼容旧别名（`goods` / `total` / `receiverName`）。库内**旧文档**若仍为 `goods`、`total`、`createdAt` 等，`list` 会映射读取并在内存中按时间排序；大数据量场景建议迁移字段并为 `createTime` 建索引。
 *
 * 其它：`_id` 由集合自动生成（导入示例时可省略）。
 */

/** 与列表页 `OrderStatus` 对齐 */
export type OrderMongoStatus = 'pending' | 'delivering' | 'completed'

/** 订单内单行商品快照（嵌入 `goodsList`） */
export interface OrderMongoGoodsLine {
  /** 下单时关联的商品 id（goods 集合 `_id`），便于售后追溯 */
  goodsId?: string
  /** 商品标题快照 */
  title: string
  /** 下单时单价（元） */
  price: number
  /** 购买件数 */
  count: number
  /** 封面图 URL 快照 */
  cover?: string
}

export interface OrderMongoDocument {
  _id?: string

  /** 下单用户（微信 openid） */
  openid: string

  /** 商品行列表（快照） */
  goodsList: OrderMongoGoodsLine[]

  /** 订单合计金额（元） */
  totalPrice: number

  /** 收货人姓名 */
  username: string

  /** 收货手机号 */
  phone: string

  /** 收货地址 */
  address: string

  /** 用户备注 */
  remark: string

  /** 配送时间偏好文案 */
  deliveryTime: string

  /** 订单状态 */
  status: OrderMongoStatus

  /** 创建时间 */
  createTime: Date | string

  /** 最后更新时间 */
  updateTime: Date | string
}

/**
 * MongoDB Compass / mongo shell 可直接导入的示例文档（JSON）。
 * `createTime` / `updateTime` 在 shell 中建议使用 `new Date()` 或 ISODate。
 */
export const ORDER_MONGO_JSON_EXAMPLE = `{
  "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
  "goodsList": [
    {
      "goodsId": "681234567890abcdef012345",
      "title": "有机高铁米粉 原味",
      "price": 39.9,
      "count": 1,
      "cover": "cloud://xxx.xxx/cover/mifen.jpg"
    },
    {
      "goodsId": "681234567890abcdef012346",
      "title": "胡萝卜南瓜泥",
      "price": 12.8,
      "count": 2,
      "cover": "cloud://xxx.xxx/cover/carrot.jpg"
    }
  ],
  "totalPrice": 65.5,
  "username": "张三",
  "phone": "13800138000",
  "address": "上海市浦东新区××路××号××室",
  "remark": "请放门口鞋柜，谢谢",
  "deliveryTime": "工作日 14:00-18:00",
  "status": "pending",
  "createTime": { "$date": "2026-05-10T10:30:00.000Z" },
  "updateTime": { "$date": "2026-05-10T10:30:00.000Z" }
}`

/** TypeScript 侧可用的示例对象（时间字段用 ISO 字符串示意） */
export const ORDER_DOCUMENT_EXAMPLE: OrderMongoDocument = {
  openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
  goodsList: [
    {
      goodsId: '681234567890abcdef012345',
      title: '有机高铁米粉 原味',
      price: 39.9,
      count: 1,
      cover: 'cloud://xxx.xxx/cover/mifen.jpg',
    },
    {
      goodsId: '681234567890abcdef012346',
      title: '胡萝卜南瓜泥',
      price: 12.8,
      count: 2,
      cover: 'cloud://xxx.xxx/cover/carrot.jpg',
    },
  ],
  totalPrice: 65.5,
  username: '张三',
  phone: '13800138000',
  address: '上海市浦东新区××路××号××室',
  remark: '请放门口鞋柜，谢谢',
  deliveryTime: '工作日 14:00-18:00',
  status: 'pending',
  createTime: '2026-05-10T10:30:00.000Z',
  updateTime: '2026-05-10T10:30:00.000Z',
}
