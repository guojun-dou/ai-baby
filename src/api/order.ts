import type {
  AdminOrderDetail,
  AdminOrderListData,
  AdminOrderListItem,
  AdminOrderListParams,
  UpdateOrderStatusData,
  UpdateOrderStatusParams,
} from '@/types/order-admin'

import { callAdminCloud } from '@/api/cloud'

import { normalizeAdminOrderStatus } from '@/types/order-admin'

const PAGE_SIZE = 10

const MOCK_ORDERS: AdminOrderListItem[] = [
  {
    _id: 'ord-mock-001',
    phone: '13800138001',
    address: '上海市浦东新区张江路 88 号',
    goodsCount: 3,
    totalPrice: 67.7,
    status: 1,
    createTime: '2026-05-10T10:20:00.000Z',
  },
  {
    _id: 'ord-mock-002',
    phone: '13800138002',
    address: '北京市朝阳区望京街 10 号',
    goodsCount: 1,
    totalPrice: 28,
    status: 2,
    createTime: '2026-05-09T15:40:00.000Z',
  },
  {
    _id: 'ord-mock-003',
    phone: '13800138003',
    address: '广州市天河区体育西路 66 号',
    goodsCount: 1,
    totalPrice: 15.5,
    status: 3,
    createTime: '2026-05-08T09:00:00.000Z',
  },
  {
    _id: 'ord-mock-004',
    phone: '13800138004',
    address: '深圳市南山区科技园南路 18 号',
    goodsCount: 3,
    totalPrice: 92.4,
    status: 3,
    createTime: '2026-05-07T18:30:00.000Z',
  },
  {
    _id: 'ord-mock-005',
    phone: '13800138005',
    address: '杭州市西湖区文三路 200 号',
    goodsCount: 2,
    totalPrice: 45.6,
    status: 1,
    createTime: '2026-05-06T11:15:00.000Z',
  },
  {
    _id: 'ord-mock-006',
    phone: '13800138006',
    address: '成都市武侯区天府大道 999 号',
    goodsCount: 1,
    totalPrice: 39.9,
    status: 0,
    createTime: '2026-05-05T16:20:00.000Z',
  },
  {
    _id: 'ord-mock-007',
    phone: '13800138007',
    address: '南京市鼓楼区中山北路 50 号',
    goodsCount: 4,
    totalPrice: 128,
    status: 2,
    createTime: '2026-05-04T08:45:00.000Z',
  },
  {
    _id: 'ord-mock-008',
    phone: '13800138008',
    address: '武汉市武昌区中南路 12 号',
    goodsCount: 2,
    totalPrice: 56.3,
    status: 4,
    createTime: '2026-05-03T14:10:00.000Z',
  },
  {
    _id: 'ord-mock-009',
    phone: '13800138009',
    address: '西安市雁塔区高新路 36 号',
    goodsCount: 1,
    totalPrice: 22.5,
    status: 1,
    createTime: '2026-05-02T19:30:00.000Z',
  },
  {
    _id: 'ord-mock-010',
    phone: '13800138010',
    address: '重庆市渝中区解放碑步行街 8 号',
    goodsCount: 2,
    totalPrice: 48.8,
    status: 3,
    createTime: '2026-05-01T12:00:00.000Z',
  },
  {
    _id: 'ord-mock-011',
    phone: '13800138011',
    address: '苏州市工业园区星湖街 168 号',
    goodsCount: 1,
    totalPrice: 18.9,
    status: 2,
    createTime: '2026-04-30T10:25:00.000Z',
  },
  {
    _id: 'ord-mock-012',
    phone: '13800138012',
    address: '天津市和平区南京路 108 号',
    goodsCount: 5,
    totalPrice: 156.2,
    status: 1,
    createTime: '2026-04-29T17:50:00.000Z',
  },
]

function filterMock(params: AdminOrderListParams): AdminOrderListData {
  const page = Math.max(1, Math.floor(params.page ?? 1))
  const pageSize = Math.min(20, Math.max(1, Math.floor(params.pageSize ?? PAGE_SIZE)))
  const status = params.status ?? 'all'

  let rows = [...MOCK_ORDERS]
  if (status !== 'all') {
    const code = normalizeAdminOrderStatus(Number(status))
    rows = rows.filter((o) => o.status === code)
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

/** 管理端订单分页列表 */
export async function getAdminOrderList(
  params: AdminOrderListParams = {},
): Promise<AdminOrderListData> {
  const payload = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? PAGE_SIZE,
    status: params.status ?? 'all',
  }

  // #ifdef MP-WEIXIN
  try {
    return await callAdminCloud<AdminOrderListData>('admin-order-list', payload)
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

const MOCK_ORDER_DETAILS: Record<string, AdminOrderDetail> = {
  'ord-mock-001': {
    _id: 'ord-mock-001',
    username: '张女士',
    phone: '13800138001',
    address: '上海市浦东新区张江路 88 号',
    remark: '请放门口',
    deliveryTime: '尽快送达',
    goodsList: [
      { title: '有机高铁米粉 原味', price: 39.9, count: 1, cover: '/static/logo.svg' },
      { title: '胡萝卜南瓜泥', price: 12.8, count: 2, cover: '/static/logo.svg' },
    ],
    totalPrice: 67.7,
    status: 1,
    createTime: '2026-05-10T10:20:00.000Z',
    updateTime: '2026-05-10T10:20:00.000Z',
  },
  'ord-mock-002': {
    _id: 'ord-mock-002',
    username: '李先生',
    phone: '13800138002',
    address: '北京市朝阳区望京街 10 号',
    remark: '',
    deliveryTime: '工作日 14:00-18:00',
    goodsList: [
      { title: '婴儿营养面条', price: 28, count: 1, cover: '/static/logo.svg' },
    ],
    totalPrice: 28,
    status: 2,
    createTime: '2026-05-09T15:40:00.000Z',
    updateTime: '2026-05-09T16:00:00.000Z',
  },
}

function mockDetailFromListItem(item: AdminOrderListItem): AdminOrderDetail {
  return {
    _id: item._id,
    username: '宝妈',
    phone: item.phone,
    address: item.address,
    remark: '',
    deliveryTime: '尽快送达',
    goodsList: [
      {
        title: '辅食商品',
        price: item.totalPrice / Math.max(item.goodsCount, 1),
        count: item.goodsCount,
        cover: '/static/logo.svg',
      },
    ],
    totalPrice: item.totalPrice,
    status: item.status,
    createTime: item.createTime,
    updateTime: item.createTime,
  }
}

/** 管理端订单详情 */
export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const id = String(orderId).trim()
  if (!id) {
    throw new Error('缺少 orderId')
  }

  // #ifdef MP-WEIXIN
  try {
    return await callAdminCloud<AdminOrderDetail>('admin-order-detail', { orderId: id })
  }
  catch (e) {
    console.error(e)
    if (MOCK_ORDER_DETAILS[id]) {
      return { ...MOCK_ORDER_DETAILS[id]! }
    }
    const listItem = MOCK_ORDERS.find((o) => o._id === id)
    if (listItem) {
      return mockDetailFromListItem(listItem)
    }
    throw e
  }
  // #endif

  // #ifndef MP-WEIXIN
  if (MOCK_ORDER_DETAILS[id]) {
    return { ...MOCK_ORDER_DETAILS[id]! }
  }
  const listItem = MOCK_ORDERS.find((o) => o._id === id)
  if (listItem) {
    return mockDetailFromListItem(listItem)
  }
  throw new Error('订单不存在')
  // #endif
}

/** 管理端更新订单状态 */
export async function updateOrderStatus(
  params: UpdateOrderStatusParams,
): Promise<UpdateOrderStatusData> {
  const payload = {
    orderId: params.orderId,
    status: params.status,
  }

  // #ifdef MP-WEIXIN
  return callAdminCloud<UpdateOrderStatusData>('admin-update-order-status', payload)
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve({
    orderId: params.orderId,
    status: params.status,
  })
  // #endif
}
