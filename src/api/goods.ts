import type { GoodDetail, GoodItem } from '@/types/goods'
import type {
  AdminGoodsDetail,
  AdminGoodsListData,
  AdminGoodsListItem,
  AdminGoodsListParams,
  SaveGoodsData,
  SaveGoodsParams,
  UpdateGoodsStatusData,
  UpdateGoodsStatusParams,
} from '@/types/goods-admin'
import type {
  CartGoodsCheckData,
  UserGoodsListData,
  UserGoodsListParams,
} from '@/types/user-goods'

import { callAdminCloud, callUserCloud } from '@/api/cloud'
import { isGoodsPurchasable } from '@/utils/goods-fields'

const MOCK_GOODS: AdminGoodsListItem[] = [
  {
    _id: 'mock-g1',
    title: '有机高铁米粉 原味',
    cover: '/static/logo.svg',
    price: 39.9,
    stock: 200,
    sales: 128,
    status: 1,
    sort: 1,
  },
  {
    _id: 'mock-g2',
    title: '胡萝卜南瓜泥',
    cover: '/static/logo.svg',
    price: 12.8,
    stock: 86,
    sales: 56,
    status: 1,
    sort: 2,
  },
  {
    _id: 'mock-g3',
    title: '婴儿营养面条',
    cover: '/static/logo.svg',
    price: 28,
    stock: 0,
    sales: 34,
    status: 0,
    sort: 3,
  },
  {
    _id: 'mock-g4',
    title: '西梅苹果泥',
    cover: '/static/logo.svg',
    price: 15.5,
    stock: 120,
    sales: 89,
    status: 1,
    sort: 4,
  },
  {
    _id: 'mock-g5',
    title: '鳕鱼南瓜粥',
    cover: '/static/logo.svg',
    price: 18.9,
    stock: 45,
    sales: 22,
    status: 1,
    sort: 5,
  },
  {
    _id: 'mock-g6',
    title: '紫薯小米糊',
    cover: '/static/logo.svg',
    price: 16.8,
    stock: 60,
    sales: 41,
    status: 0,
    sort: 6,
  },
  {
    _id: 'mock-g7',
    title: '牛肉蔬菜粥',
    cover: '/static/logo.svg',
    price: 22.5,
    stock: 30,
    sales: 15,
    status: 1,
    sort: 7,
  },
  {
    _id: 'mock-g8',
    title: '香蕉燕麦泥',
    cover: '/static/logo.svg',
    price: 14.2,
    stock: 75,
    sales: 63,
    status: 1,
    sort: 8,
  },
  {
    _id: 'mock-g9',
    title: '三文鱼土豆泥',
    cover: '/static/logo.svg',
    price: 26.8,
    stock: 18,
    sales: 9,
    status: 1,
    sort: 9,
  },
  {
    _id: 'mock-g10',
    title: '菠菜鸡肉粥',
    cover: '/static/logo.svg',
    price: 19.9,
    stock: 52,
    sales: 27,
    status: 1,
    sort: 10,
  },
  {
    _id: 'mock-g11',
    title: '蓝莓酸奶溶豆',
    cover: '/static/logo.svg',
    price: 32,
    stock: 40,
    sales: 18,
    status: 0,
    sort: 11,
  },
  {
    _id: 'mock-g12',
    title: '核桃油拌面',
    cover: '/static/logo.svg',
    price: 24.5,
    stock: 33,
    sales: 12,
    status: 1,
    sort: 12,
  },
]

function filterMock(params: AdminGoodsListParams): AdminGoodsListData {
  const page = Math.max(1, Math.floor(params.page ?? 1))
  const pageSize = Math.min(20, Math.max(1, Math.floor(params.pageSize ?? PAGE_SIZE)))
  const keyword = String(params.keyword ?? '').trim().toLowerCase()

  let rows = [...MOCK_GOODS]
  if (keyword) {
    rows = rows.filter((g) => g.title.toLowerCase().includes(keyword))
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const list = rows.slice(start, start + pageSize)

  return {
    list,
    page,
    pageSize,
    total,
    hasMore: start + list.length < total,
  }
}

/** 管理端商品分页列表 */
export async function getAdminGoodsList(
  params: AdminGoodsListParams = {},
): Promise<AdminGoodsListData> {
  const payload = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? PAGE_SIZE,
    keyword: params.keyword ?? '',
  }

  // #ifdef MP-WEIXIN
  try {
    return await callAdminCloud<AdminGoodsListData>('admin-goods-list', payload)
  }
  catch (e) {
    console.error(e)
    return filterMock(payload)
  }
  // #endif

  // #ifndef MP-WEIXIN
  return filterMock(payload)
  // #endif
}

/** 上下架 / 软删除 */
export async function updateGoodsStatus(
  params: UpdateGoodsStatusParams,
): Promise<UpdateGoodsStatusData> {
  // #ifdef MP-WEIXIN
  return callAdminCloud<UpdateGoodsStatusData>('admin-update-goods-status', {
    goodsId: params.goodsId,
    action: params.action,
    status: params.status,
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve({
    goodsId: params.goodsId,
    action: params.action,
    status: params.status,
    deleted: params.action === 'delete' ? true : undefined,
  })
  // #endif
}

const MOCK_DETAIL: Record<string, AdminGoodsDetail> = {
  'mock-g1': {
    _id: 'mock-g1',
    title: '有机高铁米粉 原味',
    subtitle: '初尝辅食优选',
    desc: '二价铁易吸收，粉质细腻好冲泡。',
    price: 39.9,
    originalPrice: 49.9,
    stock: 200,
    category: '米粉',
    age: '6月+',
    tags: ['有机', '高铁'],
    images: ['/static/logo.svg'],
    cover: '/static/logo.svg',
    status: 1,
    sort: 1,
  },
}

function mapDetail(raw: Record<string, unknown>): AdminGoodsDetail {
  const id = raw._id != null ? String(raw._id) : ''
  const imagesRaw = Array.isArray(raw.images) ? raw.images : []
  const images = imagesRaw.map((u) => String(u))
  const cover = raw.cover != null ? String(raw.cover) : images[0] ?? ''
  const tagsRaw = Array.isArray(raw.tags) ? raw.tags : []

  return {
    _id: id,
    title: raw.title != null ? String(raw.title) : '',
    subtitle: raw.subtitle != null ? String(raw.subtitle) : '',
    desc: raw.desc != null ? String(raw.desc) : '',
    price: Number(raw.price) || 0,
    originalPrice:
      raw.originalPrice != null ? Number(raw.originalPrice) : undefined,
    stock: Math.floor(Number(raw.stock) || 0),
    category: raw.category != null ? String(raw.category) : '',
    age: raw.age != null ? String(raw.age) : '',
    tags: tagsRaw.map((t) => String(t)),
    images: images.length > 0 ? images : cover ? [cover] : [],
    cover,
    status: raw.status === 0 ? 0 : 1,
    sort: Math.floor(Number(raw.sort) || 0),
  }
}

/** 管理端获取商品详情（编辑回填） */
export async function getAdminGoodsDetail(goodsId: string): Promise<AdminGoodsDetail> {
  const id = String(goodsId).trim()
  if (!id) {
    throw new Error('缺少商品 id')
  }

  // #ifdef MP-WEIXIN
  try {
    const raw = await callUserCloud<Record<string, unknown>>('goods', {
      action: 'detail',
      id,
    })
    return mapDetail(raw)
  }
  catch (e) {
    console.error(e)
    if (MOCK_DETAIL[id]) {
      return { ...MOCK_DETAIL[id]! }
    }
    throw e
  }
  // #endif

  // #ifndef MP-WEIXIN
  if (MOCK_DETAIL[id]) {
    return { ...MOCK_DETAIL[id]! }
  }
  throw new Error('商品不存在')
  // #endif
}

/** 新增 / 编辑商品 */
export async function saveGoods(params: SaveGoodsParams): Promise<SaveGoodsData> {
  const payload: Record<string, unknown> = {
    goodsId: params.goodsId,
    title: params.title,
    subtitle: params.subtitle ?? '',
    desc: params.desc,
    price: params.price,
    originalPrice: params.originalPrice,
    stock: params.stock,
    category: params.category ?? '',
    age: params.age,
    tags: params.tags,
    images: params.images,
    cover: params.cover,
    status: params.status,
    sort: params.sort ?? 0,
  }

  // #ifdef MP-WEIXIN
  return callAdminCloud<SaveGoodsData>('admin-save-goods', payload)
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve({
    goodsId: params.goodsId ?? `mock-${Date.now()}`,
  })
  // #endif
}

export { MOCK_GOODS as ADMIN_GOODS_MOCK }

const USER_MOCK_GOODS: GoodItem[] = [
  {
    _id: 'mock-1',
    title: '有机高铁米粉 原味',
    desc: '二价铁易吸收，粉质细腻好冲泡',
    price: 39.9,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['有机', '高铁'],
    age: '6月+',
    stock: 99,
    status: 1,
    sort: 1,
    sales: 128,
  },
  {
    _id: 'mock-2',
    title: '胡萝卜南瓜泥',
    desc: '无添加糖盐，开袋即食',
    price: 12.8,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['果蔬'],
    age: '7月+',
    stock: 86,
    status: 1,
    sort: 2,
    sales: 56,
  },
  {
    _id: 'mock-3',
    title: '婴儿营养面条',
    desc: '短面易吞咽，钙铁锌强化',
    price: 28,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['钙铁锌'],
    age: '8月+',
    stock: 0,
    status: 1,
    sort: 3,
    sales: 34,
  },
  {
    _id: 'mock-4',
    title: '西梅苹果泥',
    desc: '酸甜开胃，膳食纤维友好',
    price: 15.5,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['膳食纤维'],
    age: '6月+',
    stock: 120,
    status: 1,
    sort: 4,
    sales: 89,
  },
  {
    _id: 'mock-5',
    title: '鳕鱼南瓜粥',
    desc: '深海鳕鱼，软糯好消化',
    price: 18.9,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['高蛋白'],
    age: '9月+',
    stock: 45,
    status: 1,
    sort: 5,
    sales: 22,
  },
  {
    _id: 'mock-6',
    title: '紫薯小米糊',
    desc: '谷物细腻，暖胃好吸收',
    price: 16.8,
    cover: '/static/logo.svg',
    images: ['/static/logo.svg'],
    tags: ['谷物'],
    age: '6月+',
    stock: 60,
    status: 0,
    sort: 6,
    sales: 41,
  },
]

function filterUserMock(params: UserGoodsListParams): UserGoodsListData {
  const page = Math.max(1, Math.floor(params.page ?? 1))
  const pageSize = Math.min(20, Math.max(1, Math.floor(params.pageSize ?? PAGE_SIZE)))
  const keyword = String(params.keyword ?? '').trim().toLowerCase()
  const sortBy = params.sortBy ?? 'sort'
  const sortOrder = params.sortOrder ?? 'asc'

  let rows = USER_MOCK_GOODS.filter((g) => isGoodsPurchasable(g))

  if (keyword) {
    rows = rows.filter((g) => {
      const title = (g.title ?? g.name ?? '').toLowerCase()
      return title.includes(keyword)
    })
  }

  rows = [...rows].sort((a, b) => {
    if (sortBy === 'price') {
      const diff = (Number(a.price) || 0) - (Number(b.price) || 0)
      return sortOrder === 'asc' ? diff : -diff
    }
    if (sortBy === 'sales') {
      return (Number(b.sales) || 0) - (Number(a.sales) || 0)
    }
    if (sortBy === 'createTime') {
      return 0
    }
    const diff = (Number(a.sort) || 0) - (Number(b.sort) || 0)
    return diff
  })

  const total = rows.length
  const start = (page - 1) * pageSize
  const list = rows.slice(start, start + pageSize)

  return {
    list,
    page,
    pageSize,
    total,
    hasMore: start + list.length < total,
  }
}

/** 用户端商品分页列表（仅上架、未删除） */
export async function getUserGoodsList(
  params: UserGoodsListParams = {},
): Promise<UserGoodsListData> {
  const payload = {
    action: 'list',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? PAGE_SIZE,
    keyword: params.keyword ?? '',
    sortBy: params.sortBy ?? 'sort',
    sortOrder: params.sortOrder ?? 'asc',
  }

  // #ifdef MP-WEIXIN
  try {
    return await callUserCloud<UserGoodsListData>('goods', payload)
  }
  catch (e) {
    console.error(e)
    return filterUserMock(payload)
  }
  // #endif

  // #ifndef MP-WEIXIN
  return filterUserMock(payload)
  // #endif
}

/** 用户端商品详情 */
export async function getUserGoodsDetail(id: string): Promise<GoodDetail> {
  const goodsId = String(id).trim()
  if (!goodsId) {
    throw new Error('缺少商品 id')
  }

  // #ifdef MP-WEIXIN
  try {
    const data = await callUserCloud<GoodDetail>('goods', {
      action: 'detail',
      id: goodsId,
    })
    if (!isGoodsPurchasable(data)) {
      throw new Error('商品已下架')
    }
    return data
  }
  catch (e) {
    console.error(e)
    const mock = USER_MOCK_GOODS.find(
      (g) => String(g._id ?? g.id) === goodsId,
    )
    if (mock && isGoodsPurchasable(mock)) {
      return { ...mock }
    }
    throw e
  }
  // #endif

  // #ifndef MP-WEIXIN
  const mock = USER_MOCK_GOODS.find((g) => String(g._id ?? g.id) === goodsId)
  if (mock && isGoodsPurchasable(mock)) {
    return { ...mock }
  }
  throw new Error('商品不存在或已下架')
  // #endif
}

/** 购物车批量校验商品在售状态 */
export async function checkCartGoods(ids: string[]): Promise<CartGoodsCheckData> {
  const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))]

  // #ifdef MP-WEIXIN
  try {
    return await callUserCloud<CartGoodsCheckData>('goods', {
      action: 'batchCheck',
      ids: uniqueIds,
    })
  }
  catch (e) {
    console.error(e)
    const items = uniqueIds.map((id) => {
      const mock = USER_MOCK_GOODS.find((g) => String(g._id ?? g.id) === id)
      const onSale = mock ? isGoodsPurchasable(mock) : false
      return {
        _id: id,
        onSale,
        title: mock ? String(mock.title ?? '') : '',
        price: mock ? Number(mock.price) || 0 : 0,
        cover: mock ? String(mock.cover ?? '') : '',
        stock: mock ? Math.floor(Number(mock.stock) || 0) : 0,
      }
    })
    return { items }
  }
  // #endif

  // #ifndef MP-WEIXIN
  const items = uniqueIds.map((id) => {
    const mock = USER_MOCK_GOODS.find((g) => String(g._id ?? g.id) === id)
    const onSale = mock ? isGoodsPurchasable(mock) : false
    return {
      _id: id,
      onSale,
      title: mock ? String(mock.title ?? '') : '',
      price: mock ? Number(mock.price) || 0 : 0,
      cover: mock ? String(mock.cover ?? '') : '',
      stock: mock ? Math.floor(Number(mock.stock) || 0) : 0,
    }
  })
  return { items }
  // #endif
}
