<script setup lang="ts">
  import type { GoodItem } from '@/types/goods'
  import { onPullDownRefresh } from '@dcloudio/uni-app'

  import { onMounted, ref } from 'vue'
  import EmptyState from '@/components/EmptyState.vue'
  import GoodsCard from '@/components/GoodsCard.vue'
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

  interface GoodsCloudResult {
    success?: boolean
    data?: GoodItem[]
    error?: unknown
  }

  /** 本地 mock：云函数不可用、返回空或失败时使用，保证可直接运行预览 */
  const MOCK_GOODS: GoodItem[] = [
    {
      id: 'mock-1',
      title: '有机高铁米粉 原味',
      desc: '二价铁易吸收，粉质细腻好冲泡',
      price: 39.9,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['有机', '高铁'],
      age: '6月+',
      stock: 99,
    },
    {
      id: 'mock-2',
      title: '胡萝卜南瓜泥',
      desc: '无添加糖盐，开袋即食',
      price: 12.8,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['果蔬'],
      age: '7月+',
      stock: 99,
    },
    {
      id: 'mock-3',
      title: '婴儿营养面条',
      desc: '短面易吞咽，钙铁锌强化',
      price: 28,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['钙铁锌'],
      age: '8月+',
      stock: 99,
    },
    {
      id: 'mock-4',
      title: '西梅苹果泥',
      desc: '酸甜开胃，膳食纤维友好',
      price: 15.5,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['膳食纤维'],
      age: '6月+',
      stock: 99,
    },
  ]

  const { pageRootStyle } = usePageRootStyle()

  const list = ref<GoodItem[]>([])
  const loading = ref(true)
  const loadError = ref('')

  /** cloud:// → 临时 HTTPS，供列表封面展示 */
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

  async function fetchGoodsList(): Promise<GoodItem[]> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'goods',
        data: {},
        success(res) {
          const result = res.result as GoodsCloudResult
          if (result?.success && Array.isArray(result.data)) {
            resolve(result.data)
          } else {
            reject(new Error('云函数返回异常'))
          }
        },
        fail(err) {
          reject(err)
        },
      })
    })
    // #endif

    // #ifndef MP-WEIXIN
    return Promise.resolve([])
    // #endif
  }

  function applyMock() {
    list.value = MOCK_GOODS.map((m, i) => ({
      ...m,
      id: m.id ?? `mock-${i + 1}`,
    }))
    loadError.value = ''
  }

  async function loadGoods(options?: { silent?: boolean }) {
    if (!options?.silent) {
      loading.value = true
    }
    loadError.value = ''
    try {
      const data: GoodItem[] = await fetchGoodsList()
      if (data.length > 0) {
        list.value = data
        await syncListCoverUrls(list.value)
      } else {
        // #ifdef MP-WEIXIN
        list.value = []
        listCoverUrlMap.value = {}
        // #endif
        // #ifndef MP-WEIXIN
        applyMock()
        await syncListCoverUrls(list.value)
        // #endif
      }
    } catch (e) {
      console.error(e)
      applyMock()
      await syncListCoverUrls(list.value)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadGoods()
  })

  onPullDownRefresh(() => {
    loadGoods({ silent: true }).finally(() => {
      uni.stopPullDownRefresh()
    })
  })
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">辅食精选</text>
      <text class="header-sub">一口温柔，陪伴成长</text>
    </view>

    <view v-if="loading && !list.length" class="state">
      <text class="state-text">正在加载好物…</text>
    </view>

    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
      <view class="retry" @tap="loadGoods()">
        <text class="retry-text">重新加载</text>
      </view>
    </view>

    <view v-else-if="!list.length" class="home-empty">
      <EmptyState title="暂无商品" desc="稍后再来看看，或下拉刷新试试">
        <view class="empty-slot-btn" hover-class="empty-slot-btn-hover" @tap="loadGoods()">
          <text class="empty-slot-btn-text">重新加载</text>
        </view>
      </EmptyState>
    </view>

    <view v-else class="grid-wrap">
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
    .header {
      padding-left: $page-padding;
      padding-right: $page-padding;
      padding-bottom: 28rpx;

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

    .retry {
      margin-top: 32rpx;
      padding: 16rpx 40rpx;
      border-radius: 999rpx;
      background: $primary-color;
      box-shadow: $shadow;

      .retry-text {
        font-size: 28rpx;
        color: #ffffff;
      }
    }

    .home-empty {
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

    .grid-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $card-gap;
      padding: 8rpx $page-padding 40rpx;
      box-sizing: border-box;
      max-height: calc(100vh - 300rpx);
      overflow-y: auto;
    }
  }
</style>
