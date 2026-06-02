<script setup lang="ts">
  import type { UserOrderRecord } from '@/types/order'
  import type { UserOrderStatusFilter } from '@/utils/order-status'

  import { onPullDownRefresh } from '@dcloudio/uni-app'
  import { computed, ref, watch } from 'vue'
  import { getUserOrderList } from '@/api/order'
  import EmptyState from '@/components/EmptyState.vue'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { useFlexScrollHeight } from '@/composables/useFlexScrollHeight'
  import { usePagedLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'
  import { USER_ORDER_STATUS_COLOR, USER_ORDER_STATUS_LABEL } from '@/utils/order-status'

  const PAGE_SIZE = 10

  const tabs = [
    { key: 'all' as UserOrderStatusFilter, label: '全部' },
    { key: '1' as UserOrderStatusFilter, label: '待配送' },
    { key: '2' as UserOrderStatusFilter, label: '配送中' },
    { key: '3' as UserOrderStatusFilter, label: '已完成' },
    { key: '4' as UserOrderStatusFilter, label: '已取消' },
  ]

  const { pageRootStyle } = usePageRootStyle()
  const { pageLoading, loadingMore, isCurrent, runReset, runMore } = usePagedLoading()
  const { scrollStyle } = useFlexScrollHeight({ topOffsetRpx: 220, bottomOffsetRpx: 24 })

  const orders = ref<UserOrderRecord[]>([])
  const hasMore = ref(false)
  const page = ref(1)
  const activeTab = ref<UserOrderStatusFilter>('all')

  const showInitialLoading = computed(
    () => pageLoading.loading.value && orders.value.length === 0,
  )
  const showRefreshOverlay = computed(
    () => pageLoading.loading.value && orders.value.length > 0,
  )

  const orderCoverUrlMap = ref<Record<string, string>>({})

  function orderCoverDisplay(raw: string | undefined) {
    return resolveImageSrcForDisplay(raw, orderCoverUrlMap.value)
  }

  watch(
    () => orders.value.flatMap((o) => o.goodsList.map((g) => g.cover || '')),
    async (covers) => {
      const ids = [...new Set(covers.map((c) => c.trim()).filter(isCloudFileId))]
      if (ids.length === 0) {
        orderCoverUrlMap.value = {}
        return
      }
      const m = await fetchCloudTempUrlMap(ids)
      orderCoverUrlMap.value = Object.fromEntries(m)
    },
    { deep: true, immediate: true }
  )

  function statusLabel(status: UserOrderRecord['status']) {
    return USER_ORDER_STATUS_LABEL[status] ?? '未知'
  }

  function statusColor(status: UserOrderRecord['status']) {
    return USER_ORDER_STATUS_COLOR[status] ?? '#ff8ba7'
  }

  function formatDateTime(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
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

  function goodsSummary(lines: UserOrderRecord['goodsList']): string {
    if (lines.length === 0) return '暂无商品'
    if (lines.length === 1) return lines[0]!.title
    return `${lines[0]!.title} 等${lines.length}件商品`
  }

  function setTab(key: UserOrderStatusFilter) {
    if (activeTab.value === key) return
    activeTab.value = key
    loadOrders({ reset: true })
  }

  async function loadOrders(options?: { reset?: boolean; silent?: boolean }) {
    const reset = options?.reset !== false
    const silent = options?.silent === true

    if (reset) {
      await runReset(async (id) => {
        page.value = 1
        hasMore.value = false

        try {
          const data = await getUserOrderList({
            page: 1,
            pageSize: PAGE_SIZE,
            status: activeTab.value,
          })

          if (!isCurrent(id)) {
            return
          }

          orders.value = data.list
          page.value = data.page
          hasMore.value = data.hasMore
        }
        catch (e) {
          console.error(e)
          if (isCurrent(id)) {
            orders.value = []
          }
        }
      }, { silent, hasData: orders.value.length > 0 })
      return
    }

    await runMore(async () => {
      const data = await getUserOrderList({
        page: page.value + 1,
        pageSize: PAGE_SIZE,
        status: activeTab.value,
      })

      orders.value = [...orders.value, ...data.list]
      page.value = data.page
      hasMore.value = data.hasMore
    }, () => hasMore.value && !pageLoading.busy.value)
  }

  function onScrollToLower() {
    loadOrders({ reset: false })
  }

  onPullDownRefresh(() => {
    loadOrders({ reset: true, silent: true }).finally(() => {
      uni.stopPullDownRefresh()
    })
  })

  const isEmpty = computed(() => !pageLoading.loading.value && orders.value.length === 0)

  loadOrders({ reset: true })
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

    <PageLoading
      v-if="showInitialLoading"
      :show="true"
      text="加载订单中…"
    />

    <view v-else class="scroll-wrap">
      <PageLoading
        :show="showRefreshOverlay"
        overlay
        mask
        text="刷新中…"
      />
      <scroll-view
        class="scroll"
        scroll-y
        :show-scrollbar="false"
        :style="scrollStyle"
        lower-threshold="120"
        @scrolltolower="onScrollToLower"
      >
      <EmptyState
        v-if="isEmpty"
        class="order-empty"
        title="暂无相关订单"
        desc="试试切换筛选，或去首页选购好物"
      />

      <view v-for="item in orders" :key="item.id" class="card">
        <view class="card-top">
          <text class="order-id">订单号 {{ item.id }}</text>
          <view class="status-pill" :style="{ backgroundColor: `${statusColor(item.status)}18` }">
            <text class="status-text" :style="{ color: statusColor(item.status) }">
              {{ statusLabel(item.status) }}
            </text>
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

      <view v-if="orders.length > 0" class="footer">
        <text v-if="loadingMore" class="footer-text">加载中…</text>
        <text v-else-if="!hasMore" class="footer-text">— 已经到底啦 —</text>
      </view>

      <view class="scroll-bottom" />
      </scroll-view>
    </view>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的订单',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f8f8',
    enablePullDownRefresh: true,
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
        padding: 14rpx 4rpx;
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
          font-size: 22rpx;
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

  .scroll-wrap {
    flex: 1;
    height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .scroll {
    width: 100%;
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

          .status-text {
            font-size: 24rpx;
            font-weight: 500;
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

    .footer {
      padding: 16rpx 0 8rpx;
      text-align: center;

      .footer-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }

    .scroll-bottom {
      height: calc(24rpx + env(safe-area-inset-bottom));
    }
  }
</style>
