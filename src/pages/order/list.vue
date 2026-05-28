<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { usePageRootStyle } from '@/composables/usePageRootStyle'
import EmptyState from '@/components/EmptyState.vue'

import { fetchCloudTempUrlMap, isCloudFileId, resolveImageSrcForDisplay } from '@/utils/cloud-file'

/** 与后端约定一致；云函数未部署时用 mock */
export type OrderStatus = 'pending' | 'delivering' | 'completed'

export interface OrderGoodsLine {
  title: string
  cover?: string
  count: number
}

/** 云函数 list 返回项（与 orders 集合字段名对齐） */
export interface OrderRecord {
  id: string
  status: OrderStatus
  totalPrice: number
  createTime: string
  goodsList: OrderGoodsLine[]
}

interface OrdersCloudResult {
  success?: boolean
  data?: OrderRecord[]
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待配送',
  delivering: '配送中',
  completed: '已完成',
}

const MOCK_ORDERS: OrderRecord[] = [
  {
    id: 'ord-20260510001',
    status: 'pending',
    totalPrice: 67.7,
    createTime: '2026-05-10T10:20:00',
    goodsList: [
      { title: '有机高铁米粉 原味', cover: '/static/logo.svg', count: 1 },
      { title: '胡萝卜南瓜泥', cover: '/static/logo.svg', count: 2 },
    ],
  },
  {
    id: 'ord-20260509002',
    status: 'delivering',
    totalPrice: 28,
    createTime: '2026-05-09T15:40:00',
    goodsList: [{ title: '婴儿营养面条', cover: '/static/logo.svg', count: 1 }],
  },
  {
    id: 'ord-20260508003',
    status: 'completed',
    totalPrice: 15.5,
    createTime: '2026-05-08T09:00:00',
    goodsList: [{ title: '西梅苹果泥', cover: '/static/logo.svg', count: 1 }],
  },
  {
    id: 'ord-20260507004',
    status: 'completed',
    totalPrice: 92.4,
    createTime: '2026-05-07T18:30:00',
    goodsList: [
      { title: '有机高铁米粉 原味', cover: '/static/logo.svg', count: 2 },
      { title: '婴儿营养面条', cover: '/static/logo.svg', count: 1 },
    ],
  },
]

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待配送' },
  { key: 'delivering', label: '配送中' },
  { key: 'completed', label: '已完成' },
] as const

type TabKey = (typeof tabs)[number]['key']

const { pageRootStyle } = usePageRootStyle()

const orders = ref<OrderRecord[]>([])
const loading = ref(true)
const activeTab = ref<TabKey>('all')

const orderCoverUrlMap = ref<Record<string, string>>({})

function orderCoverDisplay(raw: string | undefined) {
  return resolveImageSrcForDisplay(raw, orderCoverUrlMap.value)
}

watch(
  () =>
    orders.value.flatMap((o) => o.goodsList.map((g) => g.cover || '')),
  async (covers) => {
    const ids = [...new Set(covers.map((c) => c.trim()).filter(isCloudFileId))]
    if (ids.length === 0) {
      orderCoverUrlMap.value = {}
      return
    }
    const m = await fetchCloudTempUrlMap(ids)
    orderCoverUrlMap.value = Object.fromEntries(m)
  },
  { deep: true, immediate: true },
)

const filteredOrders = computed(() => {
  const list = orders.value
  if (activeTab.value === 'all')
    return list
  return list.filter((o) => {
    if (activeTab.value === 'pending')
      return o.status === 'pending'
    if (activeTab.value === 'delivering')
      return o.status === 'delivering'
    return o.status === 'completed'
  })
})

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return iso
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function formatMoney(n: number) {
  return `¥${n.toFixed(2)}`
}

function goodsSummary(lines: OrderGoodsLine[]): string {
  if (lines.length === 0)
    return '暂无商品'
  if (lines.length === 1)
    return lines[0]!.title
  return `${lines[0]!.title} 等${lines.length}件商品`
}

function setTab(key: TabKey) {
  activeTab.value = key
}

async function fetchOrderList(): Promise<OrderRecord[]> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'orders',
      data: { action: 'list' },
      success(res) {
        const result = res.result as OrdersCloudResult
        if (result?.success && Array.isArray(result.data)) {
          resolve(result.data)
        }
        else {
          reject(new Error('empty or invalid'))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('non-mp'))
  // #endif
}

async function loadOrders() {
  loading.value = true
  try {
    const data = await fetchOrderList()
    orders.value = data
  }
  catch {
    orders.value = [...MOCK_ORDERS]
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @tap="setTab(tab.key)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="state">
      <text class="state-text">加载订单中…</text>
    </view>

    <scroll-view
      v-else
      class="scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <EmptyState
        v-if="filteredOrders.length === 0"
        class="order-empty"
        title="暂无相关订单"
        desc="试试切换筛选，或去首页选购好物"
      />

      <view
        v-for="item in filteredOrders"
        :key="item.id"
        class="card"
      >
        <view class="card-top">
          <text class="order-id">订单号 {{ item.id }}</text>
          <view class="status-pill" :class="item.status">
            <text class="status-text">{{ STATUS_LABEL[item.status] }}</text>
          </view>
        </view>

        <text class="time">{{ formatDateTime(item.createTime) }}</text>

        <view class="goods-block">
          <view class="goods-main">
            <image
              v-if="item.goodsList[0]?.cover"
              class="cover"
              :src="orderCoverDisplay(item.goodsList[0]!.cover)"
              mode="aspectFill"
            />
            <view v-else class="cover cover-ph">
              <text class="ph-text">图</text>
            </view>
            <view class="goods-text">
              <text class="goods-title">{{ goodsSummary(item.goodsList) }}</text>
              <text v-if="item.goodsList.length > 1" class="goods-sub">
                共 {{ item.goodsList.reduce((s, g) => s + g.count, 0) }} 件
              </text>
            </view>
          </view>
        </view>

        <view class="card-bottom">
          <text class="total-label">总金额</text>
          <text class="total-num">{{ formatMoney(item.totalPrice) }}</text>
        </view>
      </view>

      <view class="scroll-bottom" />
    </scroll-view>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的订单',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f8f8',
  },
}
</route>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: $page-bg;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .tabs {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    margin-top: 20rpx;
    padding: 16rpx $page-padding 8rpx;
    gap: 12rpx;
    background-color: $card-bg;
    box-shadow: $shadow;
    box-sizing: border-box;

    .tab {
      flex: 1;
      padding: 14rpx 8rpx;
      border-radius: 999rpx;
      background-color: $page-bg;
      text-align: center;

      &.active {
        background-color: rgba($primary-color, 0.15);

        .tab-text {
          color: $primary-color;
          font-weight: 600;
        }
      }

      .tab-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
  }

  .state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80rpx;

    .state-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }

  .scroll {
    flex: 1;
    height: 0;
    padding: $card-gap $page-padding 0;
    box-sizing: border-box;
  }

  .order-empty {
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .card {
    background-color: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow;
    padding: $page-padding;
    margin-bottom: $card-gap;
    box-sizing: border-box;

    .card-top {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 16rpx;

      .order-id {
        flex: 1;
        min-width: 0;
        font-size: 24rpx;
        color: $text-secondary;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status-pill {
        flex-shrink: 0;
        padding: 6rpx 18rpx;
        border-radius: 999rpx;
        background-color: $page-bg;

        .status-text {
          font-size: 24rpx;
          font-weight: 500;
          color: $primary-color;
        }

        &.delivering .status-text {
          color: #e6a23c;
        }

        &.completed .status-text {
          color: $text-secondary;
        }
      }
    }

    .time {
      display: block;
      margin-top: 12rpx;
      font-size: 24rpx;
      color: $text-secondary;
    }

    .goods-block {
      margin-top: 20rpx;
      padding-top: 20rpx;
      border-top: 2rpx solid $border-color;

      .goods-main {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 20rpx;

        .cover {
          width: 120rpx;
          height: 120rpx;
          border-radius: $radius-sm;
          flex-shrink: 0;
          background-color: $border-color;
        }

        .cover-ph {
          display: flex;
          align-items: center;
          justify-content: center;

          .ph-text {
            font-size: 22rpx;
            color: $text-secondary;
          }
        }

        .goods-text {
          flex: 1;
          min-width: 0;

          .goods-title {
            font-size: 28rpx;
            color: $text-color;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
          }

          .goods-sub {
            display: block;
            margin-top: 8rpx;
            font-size: 24rpx;
            color: $text-secondary;
          }
        }
      }
    }

    .card-bottom {
      margin-top: 20rpx;
      padding-top: 20rpx;
      border-top: 2rpx solid $border-color;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 12rpx;

      .total-label {
        font-size: 26rpx;
        color: $text-secondary;
      }

      .total-num {
        font-size: 32rpx;
        font-weight: 600;
        color: $primary-color;
      }
    }
  }

  .scroll-bottom {
    height: calc(24rpx + env(safe-area-inset-bottom));
  }
}
</style>
