<script setup lang="ts">
  import { onLoad } from '@dcloudio/uni-app'
  import { ref } from 'vue'

  import { useAdmin } from '@/composables/useAdmin'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading } = useAdmin()

  const goodsId = ref('')
  const pageTitle = ref('新增商品')

  onLoad((options) => {
    const id = options?.id ? String(options.id).trim() : ''
    goodsId.value = id
    pageTitle.value = id ? '编辑商品' : '新增商品'
  })
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">{{ pageTitle }}</text>
      <text v-if="goodsId" class="header-sub">ID: {{ goodsId }}</text>
    </view>
    <view class="card">
      <text class="card-text">商品编辑与图片上传将在下一阶段开发。</text>
    </view>
  </view>

  <view v-else-if="loading" class="page page-loading" :style="pageRootStyle">
    <text class="loading-text">校验权限中…</text>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '编辑商品',
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
        font-size: 24rpx;
        color: $text-secondary;
        word-break: break-all;
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
