<script setup lang="ts">
  import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
  import { computed, ref } from 'vue'

  import PageLoading from '@/components/PageLoading/index.vue'
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'

  /** 管理首页统计（后续由 admin 云函数替换） */
  interface AdminDashboardStats {
    todayOrders: number
    pendingDelivery: number
    goodsTotal: number
  }

  const MOCK_STATS: AdminDashboardStats = {
    todayOrders: 12,
    pendingDelivery: 5,
    goodsTotal: 36,
  }

  const QUICK_ENTRIES = [
    {
      key: 'goods',
      title: '商品管理',
      desc: '上下架、价格与库存',
      icon: 'shop' as const,
      path: '/pages/admin/goods/index',
    },
    {
      key: 'order',
      title: '订单管理',
      desc: '查看与处理订单',
      icon: 'list' as const,
      path: '/pages/admin/order/index',
    },
  ]

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, adminName, loading: authLoading } = useAdmin()
  const pageLoading = usePageLoading()

  const stats = ref<AdminDashboardStats>({ ...MOCK_STATS })

  const showAuthLoading = computed(() => authLoading.value && !canAccess.value)
  const showStatsLoading = computed(() => pageLoading.loading.value)

  async function loadStats() {
    if (!canAccess.value) {
      return
    }
    await pageLoading.run(async () => {
      try {
        // 后续接入云函数：await fetchAdminDashboardStats()
        stats.value = { ...MOCK_STATS }
      }
      catch (e) {
        console.error(e)
        stats.value = { ...MOCK_STATS }
      }
    }, { silent: true })
  }

  onShow(() => {
    if (canAccess.value) {
      void loadStats()
    }
  })

  onPullDownRefresh(() => {
    void loadStats().finally(() => {
      uni.stopPullDownRefresh()
    })
  })

  function go(path: string) {
    uni.navigateTo({
      url: path,
      fail() {
        uni.showToast({ title: '页面打开失败', icon: 'none' })
      },
    })
  }
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">管理后台</text>
      <text class="header-sub">你好，{{ adminName || '管理员' }}</text>
    </view>

    <view class="stats">
      <view class="stat-card">
        <view class="stat-icon-wrap">
          <uni-icons type="calendar" :size="22" color="#ff8ba7" />
        </view>
        <text class="stat-num">{{ showStatsLoading ? '—' : stats.todayOrders }}</text>
        <text class="stat-label">今日订单</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon-wrap">
          <uni-icons type="paperplane" :size="22" color="#ff8ba7" />
        </view>
        <text class="stat-num">{{ showStatsLoading ? '—' : stats.pendingDelivery }}</text>
        <text class="stat-label">待配送</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon-wrap">
          <uni-icons type="shop" :size="22" color="#ff8ba7" />
        </view>
        <text class="stat-num">{{ showStatsLoading ? '—' : stats.goodsTotal }}</text>
        <text class="stat-label">商品总数</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">快捷入口</text>
      <view class="menu">
        <view
          v-for="item in QUICK_ENTRIES"
          :key="item.key"
          class="menu-item"
          hover-class="menu-item-hover"
          @tap="go(item.path)"
        >
          <view class="menu-left">
            <view class="menu-icon">
              <uni-icons :type="item.icon" :size="22" color="#ff8ba7" />
            </view>
            <view class="menu-text">
              <text class="menu-title">{{ item.title }}</text>
              <text class="menu-desc">{{ item.desc }}</text>
            </view>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text class="footer-text">AI-Baby · 温柔管理</text>
    </view>
  </view>

  <view v-else-if="showAuthLoading" class="page auth-page" :style="pageRootStyle">
    <PageLoading :show="true" text="校验权限中…" />
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '管理后台',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
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

    .header {
      padding: 0 $page-padding 32rpx;

      .header-title {
        display: block;
        font-size: 36rpx;
        font-weight: 600;
        color: $text-color;
        letter-spacing: 1rpx;
      }

      .header-sub {
        display: block;
        margin-top: 12rpx;
        font-size: 26rpx;
        color: $text-secondary;
      }
    }

    .stats {
      display: flex;
      flex-direction: row;
      gap: $card-gap;
      padding: 0 $page-padding 32rpx;
      box-sizing: border-box;

      .stat-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10rpx;
        padding: 28rpx 12rpx 24rpx;
        background-color: $card-bg;
        border-radius: $radius-md;
        box-shadow: $shadow;

        .stat-icon-wrap {
          width: 56rpx;
          height: 56rpx;
          border-radius: 999rpx;
          background-color: rgba($primary-color, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-num {
          font-size: 40rpx;
          font-weight: 600;
          color: $primary-color;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 24rpx;
          color: $text-secondary;
        }
      }
    }

    .section {
      padding: 0 $page-padding;

      .section-title {
        display: block;
        margin-bottom: 20rpx;
        font-size: 30rpx;
        font-weight: 600;
        color: $text-color;
      }

      .menu {
        background-color: $card-bg;
        border-radius: $radius-md;
        box-shadow: $shadow;
        overflow: hidden;

        .menu-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 32rpx $page-padding;
          border-bottom: 2rpx solid $border-color;

          &:last-child {
            border-bottom: none;
          }

          .menu-left {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 24rpx;
          }

          .menu-icon {
            width: 72rpx;
            height: 72rpx;
            flex-shrink: 0;
            border-radius: $radius-sm;
            background-color: rgba($primary-color, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .menu-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 8rpx;
          }

          .menu-title {
            font-size: 30rpx;
            font-weight: 500;
            color: $text-color;
          }

          .menu-desc {
            font-size: 24rpx;
            color: $text-secondary;
          }

          .menu-arrow {
            flex-shrink: 0;
            margin-left: 16rpx;
            font-size: 36rpx;
            color: $text-secondary;
            font-weight: 300;
          }
        }

        .menu-item-hover {
          background-color: rgba($primary-color, 0.04);
        }
      }
    }

    .footer {
      margin-top: 48rpx;
      padding-bottom: 48rpx;
      display: flex;
      justify-content: center;

      .footer-text {
        font-size: 24rpx;
        color: $text-secondary;
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
