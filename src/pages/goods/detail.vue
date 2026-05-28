<script setup lang="ts">
  import type { GoodDetail } from '@/types/goods'
  import { onLoad } from '@dcloudio/uni-app'

  import { computed, ref, watch } from 'vue'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { useCartStore } from '@/stores/cart'
  import { toDisplayImageUrls } from '@/utils/cloud-file'
  import { getDetailAgeLabel, getDetailImageList, getGoodsCover, getGoodsTitle } from '@/utils/goods-fields'

  interface GoodsDetailCloudResult {
    success?: boolean
    data?: GoodDetail | null
    error?: unknown
  }

  const MOCK_BY_ID: Record<string, GoodDetail> = {
    'mock-1': {
      id: 'mock-1',
      title: '有机高铁米粉 原味',
      desc: '二价铁易吸收，粉质细腻好冲泡，适合初次添加辅食的宝宝。',
      price: 39.9,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg', '/static/logo.svg'],
      tags: ['有机', '高铁'],
      age: '6月+',
      ingredients: '有机大米、二价铁、锌、钙、维生素 B1 等。',
      nutrition: '强化铁锌钙，粉质细腻易冲调，适合初次添加辅食的宝宝。',
      storage: '密封置于阴凉干燥处，开封后请于 30 天内食用完毕。',
      stock: 99,
    },
    'mock-2': {
      id: 'mock-2',
      title: '胡萝卜南瓜泥',
      desc: '无添加糖盐，开袋即食。',
      price: 12.8,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['果蔬'],
      age: '7月+',
      ingredients: '胡萝卜、南瓜、水。',
      nutrition: '果蔬搭配，天然甜味，补充膳食纤维与 β-胡萝卜素。',
      storage: '常温避光保存；开袋后需冷藏并于 24 小时内用完。',
      stock: 99,
    },
    'mock-3': {
      id: 'mock-3',
      title: '婴儿营养面条',
      desc: '短面易吞咽，钙铁锌强化。',
      price: 28,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg', '/static/logo.svg', '/static/logo.svg'],
      tags: ['钙铁锌'],
      age: '8月+',
      ingredients: '小麦粉、钙、铁、锌等矿物质。',
      nutrition: '短面设计便于吞咽，钙铁锌强化配方。',
      storage: '干燥密封保存，开封后扎紧袋口防潮。',
      stock: 99,
    },
    'mock-4': {
      id: 'mock-4',
      title: '西梅苹果泥',
      desc: '酸甜开胃，膳食纤维友好。',
      price: 15.5,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['膳食纤维'],
      age: '6月+',
      ingredients: '苹果、西梅泥。',
      nutrition: '含膳食纤维，酸甜适口，帮助肠道蠕动。',
      storage: '常温阴凉干燥处保存；开袋后冷藏并尽快食用。',
      stock: 99,
    },
  }

  const DEFAULT_MOCK: GoodDetail = MOCK_BY_ID['mock-1']!

  const { pageRootStyle } = usePageRootStyle()

  const detail = ref<GoodDetail | null>(null)
  const loading = ref(true)
  const loadError = ref('')

  const goodsId = ref('')

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

  function applyMockForId(id: string) {
    const m = MOCK_BY_ID[id] ?? { ...DEFAULT_MOCK, id }
    detail.value = m
    loadError.value = ''
  }

  async function fetchGoodsDetail(id: string): Promise<GoodDetail | null> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'goods',
        data: { id },
        success(res) {
          const result = res.result as GoodsDetailCloudResult
          if (result?.success && result.data) {
            resolve(result.data)
          }
          else {
            reject(new Error('未找到商品或云函数异常'))
          }
        },
        fail(err) {
          reject(err)
        },
      })
    })
    // #endif

    // #ifndef MP-WEIXIN
    return Promise.resolve(null)
    // #endif
  }

  async function loadDetail(id: string) {
    if (!id) {
      loading.value = false
      loadError.value = '缺少商品 id'
      applyMockForId('mock-1')
      return
    }
    loading.value = true
    loadError.value = ''
    try {
      const data = await fetchGoodsDetail(id)
      if (data) {
        detail.value = data
      }
      else {
        applyMockForId(id)
      }
    } catch (e) {
      console.error(e)
      applyMockForId(id)
    } finally {
      loading.value = false
    }
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
    <view v-if="loading" class="state">
      <text class="state-text">加载中…</text>
    </view>

    <scroll-view v-else class="scroll" scroll-y :enhanced="true" :show-scrollbar="false">
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
    </scroll-view>

    <view class="bottom-bar">
      <view class="btn btn-cart" @tap="addToCart">
        <text class="btn-text btn-text-dark">加入购物车</text>
      </view>
      <view class="btn btn-buy" @tap="buyNow">
        <text class="btn-text">立即下单</text>
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
  display: flex;
  flex-direction: column;

  .state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $page-padding;

    .state-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }

  .scroll {
    flex: 1;
    height: 0;
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
    }
  }
}
</style>
