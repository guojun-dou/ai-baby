<script setup lang="ts">
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, adminName, loading } = useAdmin()
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">管理后台</text>
      <text class="header-sub">你好，{{ adminName || '管理员' }}</text>
    </view>

    <view class="card">
      <text class="card-text">管理员权限校验已通过，后续模块可在此扩展。</text>
    </view>
  </view>

  <view v-else-if="loading" class="page page-loading" :style="pageRootStyle">
    <text class="loading-text">校验权限中…</text>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '管理后台',
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

    .header {
      padding: 0 $page-padding 28rpx;

      .header-title {
        display: block;
        font-size: 36rpx;
        font-weight: 600;
        color: $text-color;
      }

      .header-sub {
        display: block;
        margin-top: 12rpx;
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

    .loading-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }
</style>
