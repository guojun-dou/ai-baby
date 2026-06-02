<script setup lang="ts">
  import type { AdminOrderDateFilter, AdminOrderListItem, AdminOrderStatusFilter } from '@/types/order-admin'
  import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
  import { computed, ref, watch } from 'vue'

  import { getAdminOrderList } from '@/api/order'
  import EmptyState from '@/components/EmptyState.vue'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { useAdmin } from '@/composables/useAdmin'
  import { usePagedLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import {
    ADMIN_ORDER_STATUS_COLOR,
    ADMIN_ORDER_STATUS_LABEL,
  } from '@/types/order-admin'

  const PAGE_SIZE = 10

  const tabs = [
    { key: 'all', label: '全部' },
    { key: '0', label: '待付款' },
    { key: '1', label: '待制作' },
    { key: '2', label: '配送中' },
    { key: '3', label: '已完成' },
    { key: '4', label: '已取消' },
  ] as const

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading: authLoading } = useAdmin()
  const { pageLoading, loadingMore, isCurrent, runReset, runMore } = usePagedLoading()

  const activeTab = ref<AdminOrderStatusFilter>('all')
  const dateFilter = ref<AdminOrderDateFilter>('all')
  const list = ref<AdminOrderListItem[]>([])
  const page = ref(1)
  const hasMore = ref(true)
  const loadError = ref('')

  const showInitialLoading = computed(
    () => pageLoading.loading.value && list.value.length === 0,
  )
  const showRefreshOverlay = computed(
    () => pageLoading.loading.value && list.value.length > 0,
  )
  const showAuthLoading = computed(() => authLoading.value && !canAccess.value)
  const showTodayBanner = computed(() => dateFilter.value === 'today')

  function parseStatusFilter(raw: unknown): AdminOrderStatusFilter | null {
    const s = raw != null ? String(raw).trim() : ''
    if (s === 'all' || s === '') {
      return 'all'
    }
    if (s === '0' || s === '1' || s === '2' || s === '3' || s === '4') {
      return s
    }
    return null
  }

  onLoad((options) => {
    const status = parseStatusFilter(options?.status)
    if (status != null) {
      activeTab.value = status
    }
    if (options?.filter === 'today') {
      dateFilter.value = 'today'
    }
  })

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`
  }

  function formatTime(iso: string) {
    if (!iso) {
      return ''
    }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) {
      return iso.slice(0, 16).replace('T', ' ')
    }
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  }

  function statusLabel(status: AdminOrderListItem['status']) {
    return ADMIN_ORDER_STATUS_LABEL[status] ?? '未知'
  }

  function statusColor(status: AdminOrderListItem['status']) {
    return ADMIN_ORDER_STATUS_COLOR[status] ?? '#999999'
  }

  function shortOrderId(id: string) {
    const s = String(id)
    if (s.length <= 12) {
      return s
    }
    return `${s.slice(0, 8)}…${s.slice(-4)}`
  }

  async function fetchPage(reset: boolean, opts?: { silent?: boolean }) {
    if (!canAccess.value) {
      return
    }

    if (reset) {
      await runReset(async (id) => {
        page.value = 1
        hasMore.value = true
        loadError.value = ''

        try {
          const data = await getAdminOrderList({
            page: 1,
            pageSize: PAGE_SIZE,
            status: activeTab.value,
            dateFilter: dateFilter.value,
          })

          if (!isCurrent(id)) {
            return
          }

          list.value = data.list
          page.value = data.page
          hasMore.value = data.hasMore
        }
        catch (e) {
          console.error(e)
          if (isCurrent(id)) {
            loadError.value = '加载失败，请下拉重试'
            list.value = []
          }
        }
      }, { silent: opts?.silent, hasData: list.value.length > 0 })
      return
    }

    await runMore(async () => {
      const data = await getAdminOrderList({
        page: page.value + 1,
        pageSize: PAGE_SIZE,
        status: activeTab.value,
        dateFilter: dateFilter.value,
      })

      list.value = [...list.value, ...data.list]
      page.value = data.page
      hasMore.value = data.hasMore
    }, () => hasMore.value && !pageLoading.busy.value)
  }

  watch(
    canAccess,
    (val) => {
      if (val && list.value.length === 0) {
        void fetchPage(true)
      }
    },
    { immediate: true },
  )

  onPullDownRefresh(() => {
    void fetchPage(true, { silent: list.value.length > 0 }).finally(() => {
      uni.stopPullDownRefresh()
    })
  })

  function onTab(key: AdminOrderStatusFilter) {
    if (activeTab.value === key) {
      return
    }
    activeTab.value = key
    void fetchPage(true)
  }

  function clearTodayFilter() {
    if (dateFilter.value === 'all') {
      return
    }
    dateFilter.value = 'all'
    void fetchPage(true)
  }

  function onLoadMore() {
    void fetchPage(false)
  }

  function goDetail(id: string) {
    uni.navigateTo({
      url: `/pages/admin/order-detail/index?id=${encodeURIComponent(id)}`,
      fail() {
        uni.showToast({ title: '页面打开失败', icon: 'none' })
      },
    })
  }
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">订单管理</text>
    </view>

    <view v-if="showTodayBanner" class="filter-banner">
      <text class="filter-banner-text">今日订单</text>
      <text class="filter-banner-clear" @tap="clearTodayFilter">清除筛选</text>
    </view>

    <scroll-view class="tabs" scroll-x :show-scrollbar="false">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        @tap="onTab(tab.key)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </scroll-view>

    <PageLoading
      v-if="showInitialLoading"
      :show="true"
      text="加载中…"
    />

    <view v-else-if="loadError && !list.length" class="state">
      <text class="state-text">{{ loadError }}</text>
      <view class="retry" hover-class="retry-hover" @tap="fetchPage(true)">
        <text class="retry-text">重新加载</text>
      </view>
    </view>

    <view v-else-if="!list.length" class="empty-wrap">
      <EmptyState title="暂无订单" desc="切换筛选或稍后再来看看" />
    </view>

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
        @scrolltolower="onLoadMore"
      >
      <view
        v-for="item in list"
        :key="item._id"
        class="card"
        hover-class="card-hover"
        @tap="goDetail(item._id)"
      >
        <view class="card-head">
          <text class="order-id">订单 {{ shortOrderId(item._id) }}</text>
          <view class="status" :style="{ backgroundColor: `${statusColor(item.status)}22` }">
            <text class="status-text" :style="{ color: statusColor(item.status) }">
              {{ statusLabel(item.status) }}
            </text>
          </view>
        </view>

        <view class="row">
          <text class="row-label">电话</text>
          <text class="row-value">{{ item.phone || '—' }}</text>
        </view>
        <view class="row">
          <text class="row-label">地址</text>
          <text class="row-value row-value-addr">{{ item.address || '—' }}</text>
        </view>

        <view class="card-foot">
          <text class="meta">{{ item.goodsCount }} 件商品 · {{ formatTime(item.createTime) }}</text>
          <text class="price">{{ formatPrice(item.totalPrice) }}</text>
        </view>
      </view>

      <view v-if="loadingMore" class="footer-hint">
        <text class="footer-text">加载更多…</text>
      </view>
      <view v-else-if="!hasMore" class="footer-hint">
        <text class="footer-text">没有更多了</text>
      </view>
      <view class="scroll-spacer" />
      </scroll-view>
    </view>
  </view>

  <view v-else-if="showAuthLoading" class="page auth-page" :style="pageRootStyle">
    <PageLoading :show="true" text="校验权限中…" />
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单管理',
    backgroundColor: '#fff7f9',
    enablePullDownRefresh: true,
  },
}
</route>

<style scoped lang="scss">
  .page {
    min-height: 100vh;
    background-color: #fff7f9;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    .header {
      padding: 0 $page-padding 16rpx;
      flex-shrink: 0;

      .header-title {
        font-size: 34rpx;
        font-weight: 600;
        color: $text-color;
      }
    }

    .filter-banner {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin: 0 $page-padding 16rpx;
      padding: 16rpx 20rpx;
      background-color: rgba($primary-color, 0.1);
      border-radius: $radius-sm;
      flex-shrink: 0;

      .filter-banner-text {
        font-size: 26rpx;
        color: $primary-color;
        font-weight: 500;
      }

      .filter-banner-clear {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }

    .tabs {
      white-space: nowrap;
      padding: 0 $page-padding 20rpx;
      flex-shrink: 0;

      .tab {
        display: inline-flex;
        padding: 14rpx 24rpx;
        margin-right: 12rpx;
        border-radius: 999rpx;
        background-color: $card-bg;
        box-shadow: $shadow;

        .tab-text {
          font-size: 24rpx;
          color: $text-secondary;
        }

        &--active {
          background-color: $primary-color;

          .tab-text {
            color: #ffffff;
            font-weight: 600;
          }
        }
      }
    }

    .state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx $page-padding;

      .state-text {
        font-size: 28rpx;
        color: $text-secondary;
      }

      .retry {
        margin-top: 32rpx;
        padding: 16rpx 40rpx;
        border-radius: 999rpx;
        background-color: $primary-color;
        box-shadow: $shadow;

        .retry-text {
          font-size: 28rpx;
          color: #ffffff;
        }
      }

      .retry-hover {
        opacity: 0.9;
      }
    }

    .empty-wrap {
      flex: 1;
      padding: 40rpx $page-padding;
    }

    .scroll-wrap {
      flex: 1;
      min-height: 0;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .scroll {
      flex: 1;
      height: 0;
      width: 100%;
      padding: 0 $page-padding;
      box-sizing: border-box;

      .card {
        padding: 28rpx $page-padding;
        margin-bottom: $card-gap;
        background-color: $card-bg;
        border-radius: $radius-md;
        box-shadow: $shadow;

        .card-head {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20rpx;

          .order-id {
            flex: 1;
            font-size: 28rpx;
            font-weight: 600;
            color: $text-color;
          }

          .status {
            flex-shrink: 0;
            padding: 8rpx 18rpx;
            border-radius: 999rpx;

            .status-text {
              font-size: 22rpx;
              font-weight: 500;
            }
          }
        }

        .row {
          display: flex;
          flex-direction: row;
          gap: 16rpx;
          margin-bottom: 12rpx;

          .row-label {
            flex-shrink: 0;
            width: 72rpx;
            font-size: 24rpx;
            color: $text-secondary;
          }

          .row-value {
            flex: 1;
            font-size: 26rpx;
            color: $text-color;
            line-height: 1.45;
          }

          .row-value-addr {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
          }
        }

        .card-foot {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          margin-top: 16rpx;
          padding-top: 16rpx;
          border-top: 2rpx solid $border-color;

          .meta {
            font-size: 24rpx;
            color: $text-secondary;
          }

          .price {
            font-size: 32rpx;
            font-weight: 600;
            color: $primary-color;
          }
        }
      }

      .card-hover {
        opacity: 0.95;
      }

      .footer-hint {
        padding: 24rpx 0;
        text-align: center;

        .footer-text {
          font-size: 24rpx;
          color: $text-secondary;
        }
      }

      .scroll-spacer {
        height: 40rpx;
      }
    }
  }

  .page-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff7f9;

    .loading-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }
</style>
