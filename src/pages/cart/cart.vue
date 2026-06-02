<script setup lang="ts">
  import { onShow } from '@dcloudio/uni-app'
  import { storeToRefs } from 'pinia'
  import { computed, ref, watch } from 'vue'

  import { checkCartGoods } from '@/api/goods'
  import EmptyState from '@/components/EmptyState.vue'
  import PageLoading from '@/components/PageLoading/index.vue'
  import SubmitBar from '@/components/SubmitBar.vue'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'

  import { useCartStore } from '@/stores/cart'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'

  const { pageRootStyle } = usePageRootStyle()
  const pageLoading = usePageLoading()

  const cart = useCartStore()
  const { cartList, totalPrice, totalCount } = storeToRefs(cart)

  const cartCoverUrlMap = ref<Record<string, string>>({})
  const invalidIds = ref<Set<string>>(new Set())

  const showValidateOverlay = computed(() => pageLoading.loading.value && cartList.value.length > 0)

  function cartCoverDisplay(raw: string) {
    return resolveImageSrcForDisplay(raw, cartCoverUrlMap.value)
  }

  watch(
    () => cartList.value.map((i) => i.cover || ''),
    async (covers) => {
      const ids = [...new Set(covers.map((c) => c.trim()).filter(isCloudFileId))]
      if (ids.length === 0) {
        cartCoverUrlMap.value = {}
        return
      }
      const m = await fetchCloudTempUrlMap(ids)
      cartCoverUrlMap.value = Object.fromEntries(m)
    },
    { deep: true, immediate: true }
  )

  /** 返回页面时与本地缓存对齐，并校验商品是否仍在上架 */
  onShow(() => {
    cart.hydrateFromStorage()
    void validateCartItems()
  })

  async function validateCartItems() {
    const ids = cartList.value.map((i) => i._id)
    if (ids.length === 0) {
      invalidIds.value = new Set()
      return
    }

    await pageLoading.run(async () => {
      try {
        const { items } = await checkCartGoods(ids)
        const nextInvalid = new Set<string>()
        const removedTitles: string[] = []

        for (const row of items) {
          if (!row.onSale || row.stock <= 0) {
            nextInvalid.add(row._id)
            cart.removeCart(row._id)
            if (row.title) {
              removedTitles.push(row.title)
            }
          }
        }

        invalidIds.value = nextInvalid

        if (removedTitles.length > 0) {
          uni.showToast({
            title:
              removedTitles.length === 1
                ? `${removedTitles[0]}已下架`
                : `${removedTitles.length}件商品已失效`,
            icon: 'none',
          })
        }
      } catch (e) {
        console.error(e)
      }
    })
  }

  function formatLinePrice(price: number, count: number) {
    return `¥${(price * count).toFixed(2)}`
  }

  function formatUnit(price: number) {
    return `¥${price.toFixed(2)}`
  }

  function dec(item: { _id: string; count: number }) {
    cart.changeCount(item._id, item.count - 1)
  }

  function inc(item: { _id: string; count: number }) {
    cart.changeCount(item._id, item.count + 1)
  }

  function confirmRemove(_id: string) {
    uni.showModal({
      title: '提示',
      content: '确认从购物车中移除该商品？',
      success(res) {
        if (res.confirm) cart.removeCart(_id)
      },
    })
  }

  function goCheckout() {
    if (cartList.value.length === 0) {
      uni.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    if (pageLoading.busy.value) {
      uni.showToast({ title: '正在校验商品', icon: 'none' })
      return
    }
    uni.navigateTo({
      url: '/pages/order/confirm',
      fail() {
        uni.showToast({ title: '结算页开发中', icon: 'none' })
      },
    })
  }

  function goShopping() {
    uni.switchTab({
      url: '/pages/index/index',
      fail() {
        uni.reLaunch({ url: '/pages/index/index' })
      },
    })
  }
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <PageLoading :show="showValidateOverlay" overlay mask text="校验商品中…" />

    <view v-if="cartList.length === 0" class="empty-wrap">
      <EmptyState title="购物车还是空的" desc="挑几件好物给宝宝吧">
        <view class="empty-slot-btn" hover-class="empty-slot-btn-hover" @tap="goShopping">
          <text class="empty-slot-btn-text">去逛逛</text>
        </view>
      </EmptyState>
    </view>

    <scroll-view v-else class="scroll" scroll-y :show-scrollbar="false">
      <view v-for="item in cartList" :key="item._id" class="card">
        <image
          v-if="item.cover"
          class="cover"
          :src="cartCoverDisplay(item.cover)"
          mode="aspectFill"
        />
        <view v-else class="cover cover-placeholder">
          <text class="placeholder-text">无图</text>
        </view>

        <view class="meta">
          <text class="title">{{ item.title }}</text>
          <view class="row">
            <text class="unit">{{ formatUnit(item.price) }}</text>
            <text class="sub">小计 {{ formatLinePrice(item.price, item.count) }}</text>
          </view>

          <view class="toolbar">
            <view class="stepper">
              <view class="step-btn" hover-class="step-btn-hover" @tap="dec(item)">
                <text class="step-icon">−</text>
              </view>
              <text class="step-num">{{ item.count }}</text>
              <view class="step-btn" hover-class="step-btn-hover" @tap="inc(item)">
                <text class="step-icon">+</text>
              </view>
            </view>
            <text class="remove" @tap="confirmRemove(item._id)">删除</text>
          </view>
        </view>
      </view>

      <view class="scroll-spacer" />
    </scroll-view>

    <SubmitBar
      v-if="cartList.length > 0"
      :price="totalPrice"
      button-text="立即预定"
      @submit="goCheckout"
    >
      <template #extra>
        <text class="submit-extra">共 {{ totalCount }} 件</text>
      </template>
    </SubmitBar>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '购物车',
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
    position: relative;

    .empty-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 60vh;
    }

    .empty-slot-btn {
      margin-top: 40rpx;
      padding: 20rpx 56rpx;
      border-radius: 999rpx;
      background-color: $primary-color;

      .empty-slot-btn-text {
        font-size: 28rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }

    .empty-slot-btn-hover {
      opacity: 0.9;
    }

    .scroll {
      flex: 1;
      height: 0;
      padding: $card-gap $page-padding 0;
      box-sizing: border-box;
    }

    .card {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 20rpx;
      padding: $page-padding;
      margin-bottom: $card-gap;
      background-color: $card-bg;
      border-radius: $radius-md;
      box-shadow: $shadow;
      box-sizing: border-box;

      .cover {
        width: 176rpx;
        height: 176rpx;
        border-radius: $radius-sm;
        flex-shrink: 0;
        background-color: $border-color;
      }

      .cover-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;

        .placeholder-text {
          font-size: 24rpx;
          color: $text-secondary;
        }
      }

      .meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 12rpx;

        .title {
          font-size: 28rpx;
          font-weight: 500;
          color: $text-color;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          overflow: hidden;
        }

        .row {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          justify-content: space-between;
          gap: 16rpx;
          flex-wrap: wrap;

          .unit {
            font-size: 30rpx;
            font-weight: 600;
            color: $primary-color;
          }

          .sub {
            font-size: 24rpx;
            color: $text-secondary;
          }
        }

        .toolbar {
          margin-top: 8rpx;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;

          .stepper {
            display: flex;
            flex-direction: row;
            align-items: center;
            border: 2rpx solid $border-color;
            border-radius: 999rpx;
            overflow: hidden;
            background-color: $card-bg;

            .step-btn {
              width: 64rpx;
              height: 56rpx;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: $page-bg;

              .step-icon {
                font-size: 32rpx;
                color: $text-color;
                line-height: 1;
              }
            }

            .step-btn-hover {
              opacity: 0.75;
            }

            .step-num {
              min-width: 72rpx;
              text-align: center;
              font-size: 28rpx;
              color: $text-color;
            }
          }

          .remove {
            font-size: 26rpx;
            color: $text-secondary;
            padding: 8rpx 12rpx;
          }
        }
      }
    }

    .scroll-spacer {
      height: calc(140rpx + env(safe-area-inset-bottom));
    }

    .submit-extra {
      font-size: 24rpx;
      color: $text-secondary;
      margin-top: 4rpx;
    }
  }
</style>
