import type {
  AdminGoodsListData,
  AdminGoodsListItem,
  AdminGoodsListParams,
  UpdateGoodsStatusData,
  UpdateGoodsStatusParams,
} from '@/types/goods-admin'

import { callAdminCloud } from '@/api/cloud'

const PAGE_SIZE = 10

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

export { MOCK_GOODS as ADMIN_GOODS_MOCK }
