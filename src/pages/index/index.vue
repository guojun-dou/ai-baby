<script setup lang="ts">
  import type { GoodItem } from '@/types/goods'
  import type { UserGoodsSortBy } from '@/types/user-goods'
  import { onPullDownRefresh } from '@dcloudio/uni-app'

  import { computed, ref } from 'vue'
  import { getUserGoodsList } from '@/api/goods'
  import EmptyState from '@/components/EmptyState.vue'
  import GoodsCard from '@/components/GoodsCard.vue'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { useFlexScrollHeight } from '@/composables/useFlexScrollHeight'
  import { usePagedLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'
  import {
    getGoodsCardTag,
    getGoodsCover,
    getGoodsDesc,
    getGoodsId,
    getGoodsTitle,
  } from '@/utils/goods-fields'

  const PAGE_SIZE = 10

  const sortOptions: { label: string; value: UserGoodsSortBy; order: 'asc' | 'desc' }[] = [
    { label: '综合排序', value: 'sort', order: 'asc' },
    { label: '销量优先', value: 'sales', order: 'desc' },
    { label: '价格从低到高', value: 'price', order: 'asc' },
    { label: '价格从高到低', value: 'price', order: 'desc' },
    { label: '最新上架', value: 'createTime', order: 'desc' },
  ]

  const { pageRootStyle } = usePageRootStyle()
  const { pageLoading, loadingMore, isCurrent, runReset, runMore } = usePagedLoading()
  const { scrollStyle } = useFlexScrollHeight({ topOffsetRpx: 360, bottomOffsetRpx: 24 })

  const list = ref<GoodItem[]>([])
  const hasMore = ref(false)
  const page = ref(1)
  const keyword = ref('')
  const searchInput = ref('')
  const sortIndex = ref(0)

  const showInitialLoading = computed(
    () => pageLoading.loading.value && list.value.length === 0,
  )
  const showRefreshOverlay = computed(
    () => pageLoading.loading.value && list.value.length > 0,
  )

  const listCoverUrlMap = ref<Record<string, string>>({})

  function listCoverDisplay(raw: string) {
    return resolveImageSrcForDisplay(raw, listCoverUrlMap.value)
  }

  async function syncListCoverUrls(items: GoodItem[]) {
    const ids = new Set<string>()
    for (const it of items) {
      const c = getGoodsCover(it)
      if (isCloudFileId(c)) {
        ids.add(c)
      }
    }
    if (ids.size === 0) {
      listCoverUrlMap.value = {}
      return
    }
    const m = await fetchCloudTempUrlMap([...ids])
    listCoverUrlMap.value = Object.fromEntries(m)
  }

  function currentSort() {
    return sortOptions[sortIndex.value] ?? sortOptions[0]!
  }

  async function loadGoods(options?: { reset?: boolean; silent?: boolean }) {
    const reset = options?.reset !== false
    const silent = options?.silent === true

    if (reset) {
      await runReset(async (id) => {
        page.value = 1
        hasMore.value = false

        try {
          const sort = currentSort()
          const data = await getUserGoodsList({
            page: 1,
            pageSize: PAGE_SIZE,
            keyword: keyword.value,
            sortBy: sort.value,
            sortOrder: sort.order,
          })

          if (!isCurrent(id)) {
            return
          }

          list.value = data.list
          page.value = data.page
          hasMore.value = data.hasMore
          await syncListCoverUrls(list.value)
        }
        catch (e) {
          console.error(e)
          if (isCurrent(id)) {
            list.value = []
            listCoverUrlMap.value = {}
          }
        }
      }, { silent, hasData: list.value.length > 0 })
      return
    }

    await runMore(async () => {
      const sort = currentSort()
      const data = await getUserGoodsList({
        page: page.value + 1,
        pageSize: PAGE_SIZE,
        keyword: keyword.value,
        sortBy: sort.value,
        sortOrder: sort.order,
      })

      list.value = [...list.value, ...data.list]
      page.value = data.page
      hasMore.value = data.hasMore
      await syncListCoverUrls(list.value)
    }, () => hasMore.value && !pageLoading.busy.value)
  }

  function onSearch() {
    keyword.value = searchInput.value.trim()
    loadGoods({ reset: true })
  }

  function onClearSearch() {
    searchInput.value = ''
    keyword.value = ''
    loadGoods({ reset: true })
  }

  function onSortChange(e: { detail: { value: string } }) {
    sortIndex.value = Number(e.detail.value) || 0
    loadGoods({ reset: true })
  }

  function onScrollToLower() {
    loadGoods({ reset: false })
  }

  onPullDownRefresh(() => {
    loadGoods({ reset: true, silent: true }).finally(() => {
      uni.stopPullDownRefresh()
    })
  })

  loadGoods({ reset: true })
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">辅食精选</text>
      <text class="header-sub">一口温柔，陪伴成长</text>
    </view>

    <view class="toolbar">
      <view class="search-bar">
        <input
          v-model="searchInput"
          class="search-input"
          type="text"
          confirm-type="search"
          placeholder="搜索商品名称"
          placeholder-class="search-placeholder"
          @confirm="onSearch"
        />
        <text v-if="searchInput" class="search-clear" @tap="onClearSearch">清除</text>
        <view class="search-btn" hover-class="search-btn-hover" @tap="onSearch">
          <text class="search-btn-text">搜索</text>
        </view>
      </view>

      <picker
        class="sort-picker"
        mode="selector"
        :range="sortOptions"
        range-key="label"
        :value="sortIndex"
        @change="onSortChange"
      >
        <view class="sort-trigger">
          <text class="sort-text">{{ currentSort().label }}</text>
          <text class="sort-arrow">▾</text>
        </view>
      </picker>
    </view>

    <PageLoading
      v-if="showInitialLoading"
      :show="true"
      text="正在加载好物…"
    />

    <view v-else-if="!list.length" class="home-empty">
      <EmptyState title="暂无商品" desc="换个关键词试试，或下拉刷新">
        <view
          class="empty-slot-btn"
          hover-class="empty-slot-btn-hover"
          @tap="loadGoods({ reset: true })"
        >
          <text class="empty-slot-btn-text">重新加载</text>
        </view>
      </EmptyState>
    </view>

    <view v-else class="scroll-wrap">
      <PageLoading
        :show="showRefreshOverlay"
        overlay
        mask
        text="刷新中…"
      />
      <scroll-view
        class="scroll"
        scroll-y
        :show-scrollbar="false"
        :style="scrollStyle"
        lower-threshold="120"
        @scrolltolower="onScrollToLower"
      >
      <view class="grid-wrap">
        <GoodsCard
          v-for="item in list"
          :key="getGoodsId(item) || getGoodsTitle(item)"
          :goods-id="getGoodsId(item)"
          :cover="listCoverDisplay(getGoodsCover(item))"
          :cart-cover="getGoodsCover(item)"
          :title="getGoodsTitle(item)"
          :price="item.price"
          :tag="getGoodsCardTag(item)"
          :description="getGoodsDesc(item)"
          show-add-cart
        />
      </view>

      <view class="footer">
        <text v-if="loadingMore" class="footer-text">加载中…</text>
        <text v-else-if="!hasMore" class="footer-text">— 已经到底啦 —</text>
      </view>
      </scroll-view>
    </view>
  </view>
</template>

<route type="home">
{
  "style": {
    "navigationBarTitleText": "AI Baby",
    "enablePullDownRefresh": true,
    "backgroundTextStyle": "dark",
    "backgroundColor": "#f8f8f8"
  }
}
</route>

<style scoped lang="scss">
  .page {
    min-height: 100vh;
    box-sizing: border-box;
    background-color: $page-bg;
    display: flex;
    flex-direction: column;

    .header {
      padding-left: $page-padding;
      padding-right: $page-padding;
      padding-bottom: 20rpx;

      .header-title {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: $text-color;
        letter-spacing: 1rpx;
      }

      .header-sub {
        display: block;
        margin-top: 12rpx;
        font-size: 24rpx;
        color: $text-secondary;
      }
    }

    .toolbar {
      padding: 0 $page-padding 16rpx;
      box-sizing: border-box;

      .search-bar {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12rpx;
        padding: 12rpx 20rpx;
        background-color: $card-bg;
        border-radius: 999rpx;
        box-shadow: $shadow;

        .search-input {
          flex: 1;
          min-width: 0;
          font-size: 28rpx;
          color: $text-color;
        }

        .search-clear {
          flex-shrink: 0;
          font-size: 24rpx;
          color: $text-secondary;
          padding: 4rpx 8rpx;
        }

        .search-btn {
          flex-shrink: 0;
          padding: 10rpx 24rpx;
          display: inline-flex;
          border-radius: 999rpx;
          background-color: $primary-color;

          .search-btn-text {
            font-size: 24rpx;
            line-height: 1;
            color: #ffffff;
          }
        }

        .search-btn-hover {
          opacity: 0.9;
        }
      }

      .sort-picker {
        margin-top: 16rpx;

        .sort-trigger {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 8rpx;
          padding: 10rpx 20rpx;
          border-radius: 999rpx;
          background-color: $card-bg;
          box-shadow: $shadow;

          .sort-text {
            font-size: 24rpx;
            color: $text-color;
          }

          .sort-arrow {
            font-size: 20rpx;
            color: $text-secondary;
          }
        }
      }
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx $page-padding;

      .state-text {
        font-size: 28rpx;
        color: $text-secondary;
        text-align: center;
      }
    }

    .home-empty {
      flex: 1;
      padding: 40rpx $page-padding 80rpx;
      box-sizing: border-box;
    }

    .empty-slot-btn {
      margin-top: 40rpx;
      padding: 20rpx 56rpx;
      border-radius: 999rpx;
      background-color: $primary-color;

      .empty-slot-btn-text {
        font-size: 28rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }

    .empty-slot-btn-hover {
      opacity: 0.9;
    }

    .scroll-wrap {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    .scroll {
      width: 100%;
    }

    .grid-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $card-gap;
      padding: 8rpx $page-padding 0;
      box-sizing: border-box;
    }

    .footer {
      padding: 32rpx $page-padding 48rpx;
      text-align: center;

      .footer-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
  }
</style>

<style>
  .search-placeholder {
    color: #999999;
  }
</style>
