<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 金额：数字格式化为 ¥x.xx，字符串原样展示 */
    price?: number | string
    /** 主按钮文案 */
    buttonText: string
    /** 左侧金额上方说明，默认「合计」 */
    label?: string
  }>(),
  {
    price: undefined,
    buttonText: '提交',
    label: '合计',
  },
)

const emit = defineEmits<{
  submit: []
}>()

const displayAmount = computed(() => {
  const p = props.price
  if (p === undefined || p === null || p === '')
    return '—'
  if (typeof p === 'number') {
    if (Number.isNaN(p))
      return '—'
    return `¥${p.toFixed(2)}`
  }
  return String(p)
})

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <view class="submit-bar">
    <view class="submit-bar__inner">
      <view class="submit-bar__left">
        <text class="submit-bar__label">{{ label }}</text>
        <text class="submit-bar__amount">{{ displayAmount }}</text>
        <slot name="extra" />
      </view>
      <view
        class="submit-bar__btn"
        hover-class="submit-bar__btn--hover"
        :hover-stay-time="80"
        @tap="handleSubmit"
      >
        <text class="submit-bar__btn-text">{{ buttonText }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: $card-bg;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;

  &__inner {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
    padding: 16rpx $page-padding;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  &__left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__label {
    font-size: 24rpx;
    color: $text-secondary;
  }

  &__amount {
    font-size: 36rpx;
    font-weight: 600;
    color: $primary-color;
  }

  &__btn {
    flex-shrink: 0;
    padding: 0 48rpx;
    height: 88rpx;
    border-radius: 999rpx;
    background-color: $primary-color;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__btn--hover {
    opacity: 0.92;
  }

  &__btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }
}
</style>