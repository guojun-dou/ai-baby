<script setup lang="ts">
  import type { AdminGoodsListItem } from '@/types/goods-admin'
  import { onPullDownRefresh } from '@dcloudio/uni-app'

  import { ref, watch } from 'vue'
  import { getAdminGoodsList, updateGoodsStatus } from '@/api/goods'
  import EmptyState from '@/components/EmptyState.vue'
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'

  const PAGE_SIZE = 10

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading: authLoading } = useAdmin()

  const keyword = ref('')
  const list = ref<AdminGoodsListItem[]>([])
  const page = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)
  const loadingMore = ref(false)
  const loadError = ref('')
  const coverUrlMap = ref<Record<string, string>>({})

  function coverDisplay(raw: string) {
    return resolveImageSrcForDisplay(raw, coverUrlMap.value)
  }

  async function syncCovers(items: AdminGoodsListItem[]) {
    const ids = new Set<string>()
    for (const it of items) {
      if (isCloudFileId(it.cover)) {
        ids.add(it.cover)
      }
    }
    if (ids.size === 0) {
      return
    }
    const m = await fetchCloudTempUrlMap([...ids])
    coverUrlMap.value = { ...coverUrlMap.value, ...Object.fromEntries(m) }
  }

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`
  }

  async function fetchPage(reset: boolean) {
    if (!canAccess.value) {
      return
    }
    if (reset) {
      if (loading.value) {
        return
      }
      loading.value = true
      page.value = 1
      hasMore.value = true
      loadError.value = ''
    }
    else {
      if (loadingMore.value || loading.value || !hasMore.value) {
        return
      }
      loadingMore.value = true
    }

    try {
      const nextPage = reset ? 1 : page.value + 1
      const data = await getAdminGoodsList({
        page: nextPage,
        pageSize: PAGE_SIZE,
        keyword: keyword.value.trim(),
      })

      if (reset) {
        list.value = data.list
        coverUrlMap.value = {}
      }
      else {
        list.value = [...list.value, ...data.list]
      }

      page.value = data.page
      hasMore.value = data.hasMore
      await syncCovers(data.list)
    }
    catch (e) {
      console.error(e)
      loadError.value = '加载失败，请下拉重试'
      if (reset) {
        list.value = []
      }
    }
    finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  watch(
    canAccess,
    (val) => {
      if (val && list.value.length === 0 && !loading.value) {
        void fetchPage(true)
      }
    },
    { immediate: true },
  )

  onPullDownRefresh(() => {
    void fetchPage(true).finally(() => {
      uni.stopPullDownRefresh()
    })
  })

  function onSearch() {
    void fetchPage(true)
  }

  function onLoadMore() {
    void fetchPage(false)
  }

  function goEdit(id?: string) {
    const q = id ? `?id=${encodeURIComponent(id)}` : ''
    uni.navigateTo({
      url: `/pages/admin/goods-edit/index${q}`,
      fail() {
        uni.showToast({ title: '页面打开失败', icon: 'none' })
      },
    })
  }

  async function onToggleStatus(item: AdminGoodsListItem) {
    const nextStatus = item.status === 1 ? 0 : 1
    const label = nextStatus === 1 ? '上架' : '下架'
    uni.showLoading({ title: `${label}中…`, mask: true })
    try {
      await updateGoodsStatus({
        goodsId: item._id,
        action: 'status',
        status: nextStatus,
      })
      item.status = nextStatus
      uni.showToast({ title: `已${label}`, icon: 'success' })
    }
    catch (e) {
      console.error(e)
      uni.showToast({ title: '操作失败', icon: 'none' })
    }
    finally {
      uni.hideLoading()
    }
  }

  function onDelete(item: AdminGoodsListItem) {
    uni.showModal({
      title: '删除商品',
      content: `确定删除「${item.title}」？删除后用户端不可见，历史订单不受影响。`,
      success(res) {
        if (!res.confirm) {
          return
        }
        uni.showLoading({ title: '删除中…', mask: true })
        void updateGoodsStatus({
          goodsId: item._id,
          action: 'delete',
        })
          .then(() => {
            list.value = list.value.filter((g) => g._id !== item._id)
            uni.showToast({ title: '已删除', icon: 'success' })
          })
          .catch((e: unknown) => {
            console.error(e)
            uni.showToast({ title: '删除失败', icon: 'none' })
          })
          .finally(() => {
            uni.hideLoading()
          })
      },
    })
  }
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="top-bar">
      <text class="top-title">商品管理</text>
      <view class="add-btn" hover-class="add-btn-hover" @tap="goEdit()">
        <uni-icons type="plusempty" :size="18" color="#ffffff" />
        <text class="add-text">新增</text>
      </view>
    </view>

    <view class="search-bar">
      <view class="search-inner">
        <uni-icons type="search" :size="18" color="#999999" />
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索商品名称"
          confirm-type="search"
          @confirm="onSearch"
        />
      </view>
      <view class="search-btn" hover-class="search-btn-hover" @tap="onSearch">
        <text class="search-btn-text">搜索</text>
      </view>
    </view>

    <view v-if="loading && !list.length" class="state">
      <text class="state-text">加载中…</text>
    </view>

    <view v-else-if="loadError && !list.length" class="state">
      <text class="state-text">{{ loadError }}</text>
      <view class="retry" hover-class="retry-hover" @tap="onSearch">
        <text class="retry-text">重新加载</text>
      </view>
    </view>

    <view v-else-if="!list.length" class="empty-wrap">
      <EmptyState title="暂无商品" desc="可新增商品或调整搜索关键词">
        <view class="empty-btn" hover-class="empty-btn-hover" @tap="goEdit()">
          <text class="empty-btn-text">新增商品</text>
        </view>
      </EmptyState>
    </view>

    <scroll-view
      v-else
      class="scroll"
      scroll-y
      :show-scrollbar="false"
      @scrolltolower="onLoadMore"
    >
      <view
        v-for="item in list"
        :key="item._id"
        class="card"
        hover-class="card-hover"
        @tap="goEdit(item._id)"
      >
        <image
          v-if="coverDisplay(item.cover)"
          class="cover"
          :src="coverDisplay(item.cover)"
          mode="aspectFill"
        />
        <view v-else class="cover cover-ph">
          <text class="ph-text">无图</text>
        </view>

        <view class="body">
          <view class="title-row">
            <text class="title">{{ item.title }}</text>
            <view class="status" :class="item.status === 1 ? 'status-on' : 'status-off'">
              <text class="status-text">{{ item.status === 1 ? '上架' : '下架' }}</text>
            </view>
          </view>

          <text class="price">{{ formatPrice(item.price) }}</text>

          <view class="meta">
            <text class="meta-item">库存 {{ item.stock }}</text>
            <text class="meta-dot">·</text>
            <text class="meta-item">销量 {{ item.sales }}</text>
          </view>

          <view class="actions" @tap.stop>
            <view
              class="action"
              hover-class="action-hover"
              @tap="onToggleStatus(item)"
            >
              <text class="action-text">{{ item.status === 1 ? '下架' : '上架' }}</text>
            </view>
            <view class="action action-danger" hover-class="action-hover" @tap="onDelete(item)">
              <text class="action-text action-text-danger">删除</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loadingMore" class="footer-hint">
        <text class="footer-text">加载更多…</text>
      </view>
      <view v-else-if="!hasMore" class="footer-hint">
        <text class="footer-text">没有更多了</text>
      </view>
      <view class="scroll-spacer" />
    </scroll-view>
  </view>

  <view v-else-if="authLoading" class="page page-loading" :style="pageRootStyle">
    <text class="loading-text">校验权限中…</text>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '商品管理',
    backgroundColor: '#fff7f9',
    enablePullDownRefresh: true,
  },
}
</route>

<style scoped lang="scss">
  .page {
    min-height: 100vh;
    background-color: #fff7f9;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    .top-bar {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 $page-padding 20rpx;
      flex-shrink: 0;

      .top-title {
        font-size: 34rpx;
        font-weight: 600;
        color: $text-color;
      }

      .add-btn {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8rpx;
        padding: 14rpx 28rpx;
        border-radius: 999rpx;
        background-color: $primary-color;
        box-shadow: $shadow;

        .add-text {
          font-size: 26rpx;
          font-weight: 600;
          color: #ffffff;
        }
      }

      .add-btn-hover {
        opacity: 0.9;
      }
    }

    .search-bar {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 16rpx;
      padding: 0 $page-padding 20rpx;
      flex-shrink: 0;

      .search-inner {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12rpx;
        padding: 0 24rpx;
        height: 72rpx;
        background-color: $card-bg;
        border-radius: 999rpx;
        box-shadow: $shadow;
      }

      .search-input {
        flex: 1;
        font-size: 28rpx;
        color: $text-color;
      }

      .search-btn {
        padding: 0 28rpx;
        height: 72rpx;
        line-height: 72rpx;
        border-radius: 999rpx;
        background-color: $card-bg;
        box-shadow: $shadow;

        .search-btn-text {
          font-size: 28rpx;
          color: $primary-color;
          font-weight: 500;
        }
      }

      .search-btn-hover {
        opacity: 0.9;
      }
    }

    .state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx $page-padding;

      .state-text {
        font-size: 28rpx;
        color: $text-secondary;
      }

      .retry {
        margin-top: 32rpx;
        padding: 16rpx 40rpx;
        border-radius: 999rpx;
        background-color: $primary-color;
        box-shadow: $shadow;

        .retry-text {
          font-size: 28rpx;
          color: #ffffff;
        }
      }

      .retry-hover {
        opacity: 0.9;
      }
    }

    .empty-wrap {
      flex: 1;
      padding: 40rpx $page-padding;
    }

    .empty-btn {
      margin-top: 32rpx;
      padding: 20rpx 48rpx;
      border-radius: 999rpx;
      background-color: $primary-color;
      box-shadow: $shadow;

      .empty-btn-text {
        font-size: 28rpx;
        color: #ffffff;
        font-weight: 600;
      }
    }

    .empty-btn-hover {
      opacity: 0.9;
    }

    .scroll {
      flex: 1;
      min-height: 0;
      height: calc(100vh - 280rpx);
      padding: 0 $page-padding;
      box-sizing: border-box;

      .card {
        display: flex;
        flex-direction: row;
        gap: 20rpx;
        padding: 24rpx;
        margin-bottom: $card-gap;
        background-color: $card-bg;
        border-radius: $radius-md;
        box-shadow: $shadow;

        .cover {
          width: 160rpx;
          height: 160rpx;
          flex-shrink: 0;
          border-radius: $radius-sm;
        }

        .cover-ph {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: $border-color;

          .ph-text {
            font-size: 24rpx;
            color: $text-secondary;
          }
        }

        .body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8rpx;

          .title-row {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 12rpx;
          }

          .title {
            flex: 1;
            font-size: 28rpx;
            font-weight: 500;
            color: $text-color;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
          }

          .status {
            flex-shrink: 0;
            padding: 6rpx 16rpx;
            border-radius: 999rpx;

            .status-text {
              font-size: 22rpx;
              font-weight: 500;
            }
          }

          .status-on {
            background-color: rgba($primary-color, 0.12);

            .status-text {
              color: $primary-color;
            }
          }

          .status-off {
            background-color: $page-bg;

            .status-text {
              color: $text-secondary;
            }
          }

          .price {
            font-size: 30rpx;
            font-weight: 600;
            color: $primary-color;
          }

          .meta {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8rpx;

            .meta-item {
              font-size: 24rpx;
              color: $text-secondary;
            }

            .meta-dot {
              font-size: 24rpx;
              color: $text-secondary;
            }
          }

          .actions {
            display: flex;
            flex-direction: row;
            gap: 16rpx;
            margin-top: 8rpx;

            .action {
              padding: 10rpx 24rpx;
              border-radius: 999rpx;
              background-color: rgba($primary-color, 0.1);

              .action-text {
                font-size: 24rpx;
                color: $primary-color;
                font-weight: 500;
              }
            }

            .action-danger {
              background-color: $page-bg;

              .action-text-danger {
                color: $text-secondary;
              }
            }

            .action-hover {
              opacity: 0.85;
            }
          }
        }
      }

      .card-hover {
        opacity: 0.95;
      }

      .footer-hint {
        padding: 24rpx 0;
        text-align: center;

        .footer-text {
          font-size: 24rpx;
          color: $text-secondary;
        }
      }

      .scroll-spacer {
        height: 40rpx;
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
