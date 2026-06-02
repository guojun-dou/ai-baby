<script setup lang="ts">
  import type { AdminOrderDetail, AdminOrderStatusCode } from '@/types/order-admin'
  import { onLoad } from '@dcloudio/uni-app'
  import { computed, ref, watch } from 'vue'

  import { getAdminOrderDetail, updateOrderStatus } from '@/api/order'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { withUniLoading } from '@/utils/uni-loading'
  import {
    ADMIN_ORDER_STATUS_COLOR,
    ADMIN_ORDER_STATUS_LABEL,
    getAdminOrderNextStatuses,
  } from '@/types/order-admin'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading: authLoading } = useAdmin()
  const pageLoading = usePageLoading()

  const orderId = ref('')
  const detail = ref<AdminOrderDetail | null>(null)
  const loadError = ref('')
  const coverUrlMap = ref<Record<string, string>>({})

  const showAuthLoading = computed(() => authLoading.value && !canAccess.value)
  const showDetailLoading = computed(() => pageLoading.loading.value)

  const nextStatuses = computed(() => {
    if (!detail.value) {
      return [] as AdminOrderStatusCode[]
    }
    return getAdminOrderNextStatuses(detail.value.status)
  })

  function coverDisplay(raw?: string) {
    return resolveImageSrcForDisplay(raw ?? '', coverUrlMap.value)
  }

  async function syncCovers(goodsList: AdminOrderDetail['goodsList']) {
    const ids = new Set<string>()
    for (const g of goodsList) {
      if (g.cover && isCloudFileId(g.cover)) {
        ids.add(g.cover)
      }
    }
    if (ids.size === 0) {
      return
    }
    const m = await fetchCloudTempUrlMap([...ids])
    coverUrlMap.value = { ...coverUrlMap.value, ...Object.fromEntries(m) }
  }

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`
  }

  function formatLine(price: number, count: number) {
    return `${formatPrice(price)} x${count}`
  }

  function formatTime(iso: string) {
    if (!iso) {
      return '—'
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

  function statusLabel(status: AdminOrderStatusCode) {
    return ADMIN_ORDER_STATUS_LABEL[status]
  }

  function statusColor(status: AdminOrderStatusCode) {
    return ADMIN_ORDER_STATUS_COLOR[status]
  }

  async function loadDetail() {
    if (!orderId.value) {
      return
    }
    loadError.value = ''
    await pageLoading.run(async () => {
      try {
        const data = await getAdminOrderDetail(orderId.value)
        detail.value = data
        coverUrlMap.value = {}
        await syncCovers(data.goodsList)
      }
      catch (e) {
        console.error(e)
        loadError.value = '加载失败'
        detail.value = null
      }
    })
  }

  onLoad((options) => {
    orderId.value = options?.id ? String(options.id).trim() : ''
  })

  watch(
    [canAccess, orderId],
    ([ok, id]) => {
      if (ok && id) {
        void loadDetail()
      }
    },
    { immediate: true },
  )

  function onStatusAction(target: AdminOrderStatusCode) {
    if (!detail.value || pageLoading.busy.value) {
      return
    }
    const label = ADMIN_ORDER_STATUS_LABEL[target]
    uni.showModal({
      title: '修改订单状态',
      content: `确认将订单设为「${label}」？`,
      success(res) {
        if (!res.confirm) {
          return
        }
        void withUniLoading(
          () => updateOrderStatus({
            orderId: detail.value!._id,
            status: target,
          }),
          '提交中…',
        )
          .then((result) => {
            if (detail.value) {
              detail.value.status = result.status
            }
            uni.showToast({ title: '状态已更新', icon: 'success' })
          })
          .catch((e: unknown) => {
            console.error(e)
            const msg = e instanceof Error ? e.message : '更新失败'
            uni.showToast({
              title: msg.length > 18 ? `${msg.slice(0, 15)}…` : msg,
              icon: 'none',
            })
          })
      },
    })
  }
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <PageLoading
      v-if="showDetailLoading"
      :show="true"
      text="加载中…"
    />

    <view v-else-if="loadError || !detail" class="state">
      <text class="state-text">{{ loadError || '订单不存在' }}</text>
      <view class="retry" hover-class="retry-hover" @tap="loadDetail">
        <text class="retry-text">重新加载</text>
      </view>
    </view>

    <scroll-view v-else class="scroll" scroll-y :show-scrollbar="false">
      <view class="head-card">
        <view class="head-row">
          <text class="order-id">订单 {{ detail._id }}</text>
          <view
            class="status-badge"
            :style="{ backgroundColor: `${statusColor(detail.status)}22` }"
          >
            <text class="status-text" :style="{ color: statusColor(detail.status) }">
              {{ statusLabel(detail.status) }}
            </text>
          </view>
        </view>
        <text class="time-text">下单 {{ formatTime(detail.createTime) }}</text>
        <text class="time-text">更新 {{ formatTime(detail.updateTime) }}</text>
      </view>

      <view class="section">
        <text class="section-label">联系方式</text>
        <view class="card">
          <view class="info-row">
            <text class="info-label">收货人</text>
            <text class="info-value">{{ detail.username || '—' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">手机号</text>
            <text class="info-value">{{ detail.phone || '—' }}</text>
          </view>
          <view v-if="detail.deliveryTime" class="info-row">
            <text class="info-label">配送</text>
            <text class="info-value">{{ detail.deliveryTime }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-label">收货地址</text>
        <view class="card">
          <text class="address-text">{{ detail.address || '—' }}</text>
          <text v-if="detail.remark" class="remark-text">备注：{{ detail.remark }}</text>
        </view>
      </view>

      <view class="section">
        <text class="section-label">商品清单</text>
        <view
          v-for="(item, index) in detail.goodsList"
          :key="index"
          class="goods-card"
        >
          <image
            v-if="coverDisplay(item.cover)"
            class="goods-cover"
            :src="coverDisplay(item.cover)"
            mode="aspectFill"
          />
          <view v-else class="goods-cover goods-ph">
            <text class="ph-text">无图</text>
          </view>
          <view class="goods-body">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-line">{{ formatLine(item.price, item.count) }}</text>
          </view>
        </view>
        <view class="total-row">
          <text class="total-label">合计</text>
          <text class="total-price">{{ formatPrice(detail.totalPrice) }}</text>
        </view>
      </view>

      <view v-if="nextStatuses.length" class="section">
        <text class="section-label">状态操作</text>
        <view class="actions">
          <view
            v-for="st in nextStatuses"
            :key="st"
            class="action-btn"
            :style="{ backgroundColor: statusColor(st) }"
            hover-class="action-hover"
            @tap="onStatusAction(st)"
          >
            <text class="action-text">{{ statusLabel(st) }}</text>
          </view>
        </view>
      </view>

      <view class="scroll-spacer" />
    </scroll-view>
  </view>

  <view v-else-if="showAuthLoading" class="page auth-page" :style="pageRootStyle">
    <PageLoading :show="true" text="校验权限中…" />
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单详情',
    backgroundColor: '#fff7f9',
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

    .scroll {
      flex: 1;
      height: 0;
      width: 100%;
      padding: 0 $page-padding;
      box-sizing: border-box;

      .head-card {
        padding: 28rpx $page-padding;
        margin-bottom: $card-gap;
        background-color: $card-bg;
        border-radius: $radius-md;
        box-shadow: $shadow;

        .head-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 16rpx;
          margin-bottom: 12rpx;

          .order-id {
            flex: 1;
            font-size: 28rpx;
            font-weight: 600;
            color: $text-color;
            word-break: break-all;
          }

          .status-badge {
            flex-shrink: 0;
            padding: 8rpx 18rpx;
            border-radius: 999rpx;

            .status-text {
              font-size: 22rpx;
              font-weight: 500;
            }
          }
        }

        .time-text {
          display: block;
          font-size: 24rpx;
          color: $text-secondary;
          line-height: 1.6;
        }
      }

      .section {
        margin-bottom: $card-gap;

        .section-label {
          display: block;
          margin-bottom: 16rpx;
          font-size: 28rpx;
          font-weight: 600;
          color: $text-color;
        }

        .card {
          padding: 24rpx $page-padding;
          background-color: $card-bg;
          border-radius: $radius-md;
          box-shadow: $shadow;

          .info-row {
            display: flex;
            flex-direction: row;
            gap: 20rpx;
            margin-bottom: 16rpx;

            &:last-child {
              margin-bottom: 0;
            }

            .info-label {
              flex-shrink: 0;
              width: 100rpx;
              font-size: 26rpx;
              color: $text-secondary;
            }

            .info-value {
              flex: 1;
              font-size: 28rpx;
              color: $text-color;
            }
          }

          .address-text {
            display: block;
            font-size: 28rpx;
            line-height: 1.5;
            color: $text-color;
          }

          .remark-text {
            display: block;
            margin-top: 16rpx;
            font-size: 26rpx;
            color: $text-secondary;
            line-height: 1.45;
          }
        }

        .goods-card {
          display: flex;
          flex-direction: row;
          gap: 20rpx;
          padding: 20rpx;
          margin-bottom: 16rpx;
          background-color: $card-bg;
          border-radius: $radius-md;
          box-shadow: $shadow;

          .goods-cover {
            width: 120rpx;
            height: 120rpx;
            flex-shrink: 0;
            border-radius: $radius-sm;
          }

          .goods-ph {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: $border-color;

            .ph-text {
              font-size: 24rpx;
              color: $text-secondary;
            }
          }

          .goods-body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 10rpx;

            .goods-title {
              font-size: 28rpx;
              color: $text-color;
              line-height: 1.4;
            }

            .goods-line {
              font-size: 26rpx;
              color: $primary-color;
              font-weight: 500;
            }
          }
        }

        .total-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 20rpx $page-padding;
          background-color: $card-bg;
          border-radius: $radius-md;
          box-shadow: $shadow;

          .total-label {
            font-size: 28rpx;
            color: $text-color;
            font-weight: 500;
          }

          .total-price {
            font-size: 34rpx;
            font-weight: 600;
            color: $primary-color;
          }
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 16rpx;

          .action-btn {
            padding: 24rpx $page-padding;
            border-radius: $radius-md;
            box-shadow: $shadow;
            text-align: center;

            .action-text {
              font-size: 28rpx;
              font-weight: 600;
              color: #ffffff;
            }
          }

          .action-hover {
            opacity: 0.9;
          }
        }
      }

      .scroll-spacer {
        height: calc(40rpx + env(safe-area-inset-bottom));
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
