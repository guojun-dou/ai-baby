<script setup lang="ts">
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading } = useAdmin()
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">订单管理</text>
      <text class="header-sub">第四阶段开发中</text>
    </view>
    <view class="card">
      <text class="card-text">订单列表与状态管理功能即将上线。</text>
    </view>
  </view>

  <view v-else-if="loading" class="page page-loading" :style="pageRootStyle">
    <text class="loading-text">校验权限中…</text>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单管理',
    backgroundColor: '#fff7f9',
  },
}
</route>

<style scoped lang="scss">
  .page {
    min-height: 100vh;
    background-color: #fff7f9;
    box-sizing: border-box;

    .header {
      padding: 0 $page-padding 24rpx;

      .header-title {
        display: block;
        font-size: 34rpx;
        font-weight: 600;
        color: $text-color;
      }

      .header-sub {
        display: block;
        margin-top: 8rpx;
        font-size: 26rpx;
        color: $text-secondary;
      }
    }

    .card {
      margin: 0 $page-padding;
      padding: 32rpx $page-padding;
      background-color: $card-bg;
      border-radius: $radius-md;
      box-shadow: $shadow;

      .card-text {
        font-size: 28rpx;
        line-height: 1.5;
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
