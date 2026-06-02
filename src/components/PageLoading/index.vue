<script setup lang="ts">
  withDefaults(
    defineProps<{
      /** 是否展示 */
      show?: boolean
      /** 提示文案 */
      text?: string
      /** 遮罩模式：覆盖在内容上方 */
      overlay?: boolean
      /** overlay 时是否半透明遮罩 */
      mask?: boolean
      /** 占满父容器高度（列表首屏） */
      block?: boolean
    }>(),
    {
      show: false,
      text: '加载中…',
      overlay: false,
      mask: false,
      block: true,
    },
  )
</script>

<template>
  <view
    v-if="show"
    class="page-loading"
    :class="{
      overlay,
      mask,
      block: block && !overlay,
    }"
  >
    <view class="inner">
      <view class="spinner" />
      <text v-if="text" class="text">{{ text }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
  .page-loading {
    box-sizing: border-box;

    &.block {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 80rpx $page-padding;
      min-height: 40vh;
    }

    &.overlay {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      &.mask {
        background-color: rgba($page-bg, 0.72);
        pointer-events: auto;
      }
    }

    .inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20rpx;
    }

    .spinner {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      border: 4rpx solid rgba($primary-color, 0.2);
      border-top-color: $primary-color;
      animation: page-loading-spin 0.75s linear infinite;
    }

    .text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }

  @keyframes page-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
