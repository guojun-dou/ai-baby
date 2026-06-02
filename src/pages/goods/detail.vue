<script setup lang="ts">
  import type { GoodDetail } from '@/types/goods'
  import { onLoad } from '@dcloudio/uni-app'

  import { computed, ref, watch } from 'vue'
  import { getUserGoodsDetail } from '@/api/goods'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { useCartStore } from '@/stores/cart'
  import { toDisplayImageUrls } from '@/utils/cloud-file'
  import { getDetailAgeLabel, getDetailImageList, getGoodsCover, getGoodsTitle, isGoodsPurchasable } from '@/utils/goods-fields'

  const { pageRootStyle } = usePageRootStyle()
  const pageLoading = usePageLoading()
  const showLoading = computed(() => pageLoading.loading.value)

  const detail = ref<GoodDetail | null>(null)
  const loadError = ref('')

  const goodsId = ref('')

  const canPurchase = computed(() => isGoodsPurchasable(detail.value))

  const swiperList = computed(() => getDetailImageList(detail.value))

  /** 轮播展示用 HTTPS；购物车仍写入原始 fileID */
  const swiperDisplayUrls = ref<string[]>([])

  watch(
    swiperList,
    (urls) => {
      if (urls.length === 0) {
        swiperDisplayUrls.value = []
        return
      }
      swiperDisplayUrls.value = []
      void toDisplayImageUrls(urls).then((resolved) => {
        swiperDisplayUrls.value = resolved.filter(Boolean)
      })
    },
    { immediate: true },
  )

  const displayTitle = computed(() => {
    const d = detail.value
    if (!d) {
      return ''
    }
    const t = getGoodsTitle(d)
    return t === '未命名商品' ? '商品详情' : t
  })

  const priceText = computed(() => {
    const d = detail.value
    if (!d) {
      return ''
    }
    const p = d.price
    if (p === undefined || p === null || Number.isNaN(Number(p))) {
      return '询价'
    }
    return `¥${Number(p).toFixed(2)}`
  })

  const monthLabel = computed(() => getDetailAgeLabel(detail.value))

  const ingredientsText = computed(() => {
    const d = detail.value
    if (!d) {
      return ''
    }
    return (d.ingredients ?? d.ingredient_desc ?? '').trim() || '暂无说明'
  })

  const nutritionText = computed(() => {
    const d = detail.value
    if (!d) {
      return ''
    }
    return (d.nutrition ?? d.nutrition_desc ?? '').trim() || '暂无说明'
  })

  const storageText = computed(() => {
    const d = detail.value
    if (!d) {
      return ''
    }
    return (d.storage ?? d.storage_desc ?? '').trim() || '暂无说明'
  })

  async function loadDetail(id: string) {
    if (!id) {
      loadError.value = '缺少商品 id'
      return
    }
    loadError.value = ''
    await pageLoading.run(async () => {
      try {
        const data = await getUserGoodsDetail(id)
        detail.value = data
      }
      catch (e) {
        console.error(e)
        detail.value = null
        loadError.value = e instanceof Error ? e.message : '商品不存在或已下架'
      }
    })
  }

  const cartStore = useCartStore()

  onLoad((options) => {
    const id = options?.id ? String(options.id) : ''
    goodsId.value = id
    loadDetail(id)
  })

  function addToCart() {
    const d = detail.value
    if (!d) {
      uni.showToast({ title: '商品加载中', icon: 'none' })
      return
    }
    if (!canPurchase.value) {
      uni.showToast({ title: '商品已下架或售罄', icon: 'none' })
      return
    }
    const id = String(d._id ?? d.id ?? goodsId.value)
    const rawList = getDetailImageList(d)
    const cover = rawList[0] ?? getGoodsCover(d) ?? ''
    try {
      cartStore.addCart({
        _id: id,
        title: displayTitle.value,
        price: Number(d.price ?? 0),
        cover,
        count: 1,
      })
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    } catch {
      uni.showToast({ title: '加入失败', icon: 'none' })
    }
  }

  function buyNow() {
    const d = detail.value
    if (!d) {
      uni.showToast({ title: '商品加载中', icon: 'none' })
      return
    }
    if (!canPurchase.value) {
      uni.showToast({ title: '商品已下架或售罄', icon: 'none' })
      return
    }
    const id = encodeURIComponent(String(d._id ?? d.id ?? goodsId.value))
    uni.navigateTo({
      url: `/pages/order/confirm?id=${id}&qty=1`,
      fail() {
        uni.showToast({ title: '下单页开发中', icon: 'none' })
      },
    })
  }
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <PageLoading :show="showLoading" text="加载中…" />

    <view v-if="!showLoading && !detail" class="state">
      <text class="state-text">{{ loadError || '商品不存在或已下架' }}</text>
    </view>

    <view v-else-if="detail" class="body">
      <view class="swiper-wrap">
        <swiper
          v-if="swiperDisplayUrls.length > 0"
          class="swiper"
          circular
          indicator-dots
          indicator-active-color="#ff8ba7"
          indicator-color="rgba(0,0,0,0.2)"
          autoplay
          :interval="4000"
        >
          <swiper-item v-for="(src, i) in swiperDisplayUrls" :key="i">
            <image class="swiper-img" :src="src" mode="aspectFill" />
          </swiper-item>
        </swiper>
        <view v-else class="swiper-placeholder">
          <text class="placeholder-text">暂无图片</text>
        </view>
      </view>

      <view class="card main-card">
        <text class="title">{{ displayTitle }}</text>
        <view class="row-price">
          <text class="price">{{ priceText }}</text>
          <view class="month-pill">
            <text class="month-pill-text">{{ monthLabel }}</text>
          </view>
        </view>
      </view>

      <view class="card section">
        <text class="section-title">食材说明</text>
        <text class="section-body">{{ ingredientsText }}</text>
      </view>

      <view class="card section">
        <text class="section-title">营养说明</text>
        <text class="section-body">{{ nutritionText }}</text>
      </view>

      <view class="card section">
        <text class="section-title">保存方式</text>
        <text class="section-body">{{ storageText }}</text>
      </view>

      <view class="scroll-spacer" />
    </view>

    <view v-if="detail" class="bottom-bar">
      <view
        class="btn btn-cart"
        :class="{ disabled: !canPurchase }"
        @tap="addToCart"
      >
        <text class="btn-text btn-text-dark">{{ canPurchase ? '加入购物车' : '已下架' }}</text>
      </view>
      <view
        class="btn btn-buy"
        :class="{ disabled: !canPurchase }"
        @tap="buyNow"
      >
        <text class="btn-text">{{ canPurchase ? '立即下单' : '暂不可购' }}</text>
      </view>
    </view>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '商品详情',
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
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));

  .state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80rpx $page-padding;

    .state-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }

  .body {
    width: 100%;
  }

  .swiper-wrap {
    width: 100%;
    background-color: $card-bg;

    .swiper {
      width: 100%;
      height: 750rpx;
    }

    .swiper-img {
      width: 100%;
      height: 100%;
      display: block;
    }

    .swiper-placeholder {
      width: 100%;
      height: 750rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $border-color;

      .placeholder-text {
        font-size: 28rpx;
        color: $text-secondary;
      }
    }
  }

  .card {
    background-color: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow;
    margin-left: $page-padding;
    margin-right: $page-padding;
    margin-top: $card-gap;
    padding: $page-padding;
    box-sizing: border-box;

    &.main-card {
      margin-top: -32rpx;
      position: relative;
      z-index: 1;
    }

    .title {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color;
      line-height: 1.45;
    }

    .row-price {
      margin-top: 20rpx;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 24rpx;

      .price {
        font-size: 40rpx;
        font-weight: 600;
        color: $primary-color;
      }

      .month-pill {
        flex-shrink: 0;
        padding: 10rpx 24rpx;
        border-radius: 999rpx;
        background-color: rgba($primary-color, 0.12);

        .month-pill-text {
          font-size: 24rpx;
          color: $primary-color;
          font-weight: 500;
        }
      }
    }

    &.section {
      .section-title {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: $text-color;
        margin-bottom: 16rpx;
      }

      .section-body {
        display: block;
        font-size: 28rpx;
        line-height: 1.6;
        color: $text-secondary;
      }
    }
  }

  .scroll-spacer {
    height: calc(140rpx + env(safe-area-inset-bottom));
  }

  .bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20rpx;
    padding: 16rpx $page-padding;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background-color: $card-bg;
    box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.05);
    box-sizing: border-box;

    .btn {
      flex: 1;
      height: 88rpx;
      border-radius: 999rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .btn-text {
        font-size: 30rpx;
        font-weight: 600;
      }

      &.btn-cart {
        background-color: $page-bg;
        border: 2rpx solid $border-color;

        .btn-text {
          color: $text-color;
        }
      }

      &.btn-buy {
        background-color: $primary-color;

        .btn-text {
          color: #ffffff;
        }
      }

      &.disabled {
        opacity: 0.45;
      }
    }
  }
}
</style>
