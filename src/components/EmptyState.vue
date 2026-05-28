<script setup lang="ts">
/**
 * 空状态：购物车为空、无订单、无商品等场景共用。
 */
withDefaults(
  defineProps<{
    /** 主标题 */
    title: string
    /** 辅助说明 */
    desc?: string
    /** 插图地址；不传则显示柔和占位图形 */
    image?: string
  }>(),
  {
    title: '',
    desc: '',
    image: '',
  },
)
</script>

<template>
  <view class="empty-state">
    <view class="empty-state__visual">
      <image
        v-if="image"
        class="empty-state__img"
        :src="image"
        mode="aspectFit"
      />
      <view v-else class="empty-state__placeholder">
        <view class="empty-state__circle">
          <text class="empty-state__emoji">♡</text>
        </view>
      </view>
    </view>
    <text class="empty-state__title">{{ title }}</text>
    <text v-if="desc" class="empty-state__desc">{{ desc }}</text>
    <slot />
  </view>
</template>

<style scoped lang="scss">
.empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx $page-padding 48rpx;
  box-sizing: border-box;

  &__visual {
    margin-bottom: 32rpx;
  }

  &__img {
    width: 240rpx;
    height: 240rpx;
    display: block;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__circle {
    width: 200rpx;
    height: 200rpx;
    border-radius: 999rpx;
    background-color: rgba($primary-color, 0.1);
    border: 4rpx solid rgba($primary-color, 0.18);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__emoji {
    font-size: 72rpx;
    line-height: 1;
    opacity: 0.65;
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-color;
    text-align: center;
    line-height: 1.45;
  }

  &__desc {
    margin-top: 16rpx;
    font-size: 26rpx;
    color: $text-secondary;
    text-align: center;
    line-height: 1.5;
    max-width: 560rpx;
  }
}
</style>
