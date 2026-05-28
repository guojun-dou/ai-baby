<script setup lang="ts">
  import { computed } from 'vue'

  import { useCartStore } from '@/stores/cart'

  /**
   * 商品卡片：展示图、标题、价格、标签、描述；点击跳转详情。
   */
  const props = withDefaults(
    defineProps<{
      /** 商品 id，用于跳转 /pages/goods/detail */
      goodsId: string
      /** 商品主图 URL */
      cover?: string
      /** 写入购物车的封面（cloud:// 等原始值），不传则用 cover */
      cartCover?: string
      /** 标题 */
      title: string
      /** 价格（数字自动格式化为 ¥x.xx；字符串则原样展示） */
      price?: number | string
      /** 标签文案，如月龄「6月+」 */
      tag?: string
      /** 简短描述 */
      description?: string
      /** 详情路径，默认标准商品详情 */
      detailPath?: string
      /** 是否展示「加入购物车」按钮 */
      showAddCart?: boolean
    }>(),
    {
      cover: '',
      cartCover: '',
      title: '',
      price: undefined,
      tag: '',
      description: '',
      detailPath: '/pages/goods/detail',
      showAddCart: false,
    }
  )

  const cartStore = useCartStore()

  const displayPrice = computed(() => {
    const p = props.price
    if (p === undefined || p === null || p === '') return '询价'
    if (typeof p === 'number') {
      if (Number.isNaN(p)) return '询价'
      return `¥${p.toFixed(2)}`
    }
    return String(p)
  })

  const showTag = computed(() => Boolean(props.tag && String(props.tag).trim()))

  function onTap() {
    const id = String(props.goodsId ?? '').trim()
    if (!id) {
      uni.showToast({ title: '缺少商品信息', icon: 'none' })
      return
    }
    const base = props.detailPath.replace(/\/$/, '')
    const url = `${base}?id=${encodeURIComponent(id)}`
    uni.navigateTo({
      url,
      fail() {
        uni.showToast({ title: '页面打开失败', icon: 'none' })
      },
    })
  }

  function onAddCart() {
    const id = String(props.goodsId ?? '').trim()
    if (!id) {
      uni.showToast({ title: '缺少商品信息', icon: 'none' })
      return
    }
    const p = props.price
    const price =
      typeof p === 'number' ? (Number.isNaN(p) ? 0 : p) : Number(p) || 0
    const cover = String(props.cartCover || props.cover || '').trim()
    try {
      cartStore.addCart({
        _id: id,
        title: props.title,
        price,
        cover,
        count: 1,
      })
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    } catch {
      uni.showToast({ title: '加入失败', icon: 'none' })
    }
  }
</script>

<template>
  <view class="goods-card" hover-class="goods-card--hover" :hover-stay-time="80" @tap="onTap">
    <view class="goods-card__media">
      <image v-if="cover" class="goods-card__img" :src="cover" mode="aspectFill" lazy-load />
      <view v-else class="goods-card__img goods-card__ph">
        <text class="goods-card__ph-text">暂无图片</text>
      </view>
      <view v-if="showTag" class="goods-card__tag">
        <text class="goods-card__tag-text">{{ tag }}</text>
      </view>
    </view>
    <view class="goods-card__body">
      <text class="goods-card__title">{{ title }}</text>
      <text v-if="description" class="goods-card__desc">{{ description }}</text>
      <view class="goods-card__foot">
        <text class="goods-card__price">{{ displayPrice }}</text>
        <view
          v-if="showAddCart"
          class="goods-card__add"
          hover-class="goods-card__add--hover"
          @tap.stop="onAddCart"
        >
          <uni-icons class="goods-card__add-icon" type="cart-filled" :size="14" color="#ffffff" />
          <text class="goods-card__add-text">加入购物车</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
  .goods-card {
    background-color: $card-bg;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow;
    box-sizing: border-box;

    &--hover {
      opacity: 0.92;
    }

    &__media {
      position: relative;
      width: 100%;
      padding-top: 100%;
      background-color: $page-bg;
    }

    &__img {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: $radius-md $radius-md 0 0;
    }

    &__ph {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $border-color;
    }

    &__ph-text {
      font-size: 24rpx;
      color: $text-secondary;
    }

    &__tag {
      position: absolute;
      left: 16rpx;
      top: 16rpx;
      padding: 8rpx 18rpx;
      border-radius: 999rpx;
      background-color: $card-bg;
      box-shadow: $shadow;
    }

    &__tag-text {
      font-size: 24rpx;
      color: $primary-color;
      font-weight: 500;
    }

    &__body {
      padding: 20rpx 18rpx 24rpx;
    }

    &__title {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      font-size: 28rpx;
      line-height: 1.45;
      color: $text-color;
      font-weight: 500;
    }

    &__desc {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
      margin-top: 10rpx;
      font-size: 24rpx;
      line-height: 1.4;
      color: $text-secondary;
    }

    &__foot {
      margin-top: 14rpx;
    }

    &__price {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      color: $primary-color;
    }

    &__add {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      margin-top: 16rpx;
      height: 64rpx;
      border-radius: 999rpx;
      background-color: $primary-color;
      box-shadow: $shadow;

      &--hover {
        opacity: 0.9;
      }
    }

    &__add-icon {
      flex-shrink: 0;
      line-height: 1;
    }

    &__add-text {
      font-size: 24rpx;
      font-weight: 600;
      color: #ffffff;
    }
  }
</style>
