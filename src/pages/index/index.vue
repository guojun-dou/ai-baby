<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

/** 与云数据库 goods 集合字段对齐，缺失字段用展示兜底 */
export interface GoodItem {
  _id?: string
  id?: string
  title?: string
  name?: string
  price?: number
  image?: string
  cover?: string
  imgUrl?: string
  /** 月龄：数字或文案，如 6 或 "0-6月" */
  monthAge?: string | number
  month_label?: string
  ageMonths?: number
}

interface GoodsCloudResult {
  success?: boolean
  data?: GoodItem[]
  error?: unknown
}

const list = ref<GoodItem[]>([])
const loading = ref(true)
const loadError = ref('')

const statusBarHeight = ref(0)

const pagePaddingTop = computed(() => {
  const h = statusBarHeight.value || 0
  return `${h + 12}px`
})

function getItemId(item: GoodItem): string {
  return String(item._id ?? item.id ?? '')
}

function getTitle(item: GoodItem): string {
  return (item.title ?? item.name ?? '未命名商品').trim() || '未命名商品'
}

function getCover(item: GoodItem): string {
  return (item.image ?? item.cover ?? item.imgUrl ?? '').trim()
}

function getPriceText(item: GoodItem): string {
  const p = item.price
  if (p === undefined || p === null || Number.isNaN(Number(p)))
    return '询价'
  const n = Number(p)
  return `¥${n.toFixed(2)}`
}

function getMonthLabel(item: GoodItem): string {
  if (item.month_label != null && String(item.month_label).trim() !== '')
    return String(item.month_label).trim()
  if (item.monthAge != null && String(item.monthAge).trim() !== '')
    return `${item.monthAge}月龄`
  if (item.ageMonths != null && !Number.isNaN(Number(item.ageMonths)))
    return `${item.ageMonths}月龄`
  return '全阶段'
}

function goDetail(item: GoodItem) {
  const id = getItemId(item)
  if (!id) {
    uni.showToast({ title: '商品信息不完整', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/goods/detail?id=${encodeURIComponent(id)}`,
    fail() {
      uni.showToast({ title: '请先添加详情页', icon: 'none' })
    },
  })
}

async function fetchGoodsList(): Promise<GoodItem[]> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'goods',
      data: {},
      success(res) {
        const result = res.result as GoodsCloudResult
        if (result?.success && Array.isArray(result.data))
          resolve(result.data)
        else
          reject(new Error('云函数返回异常'))
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

async function loadGoods() {
  loading.value = true
  loadError.value = ''
  try {
    list.value = await fetchGoodsList()
  }
  catch (e) {
    console.error(e)
    loadError.value = '加载失败，请稍后重试'
    list.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight ?? 0
  }
  catch {
    statusBarHeight.value = 0
  }
  loadGoods()
})
</script>

<template>
  <view class="page">
    <view class="header" :style="{ paddingTop: pagePaddingTop }">
      <text class="header-title">好物精选</text>
      <text class="header-sub">给宝宝的温柔之选</text>
    </view>

    <view v-if="loading" class="state">
      <text class="state-text">正在加载好物…</text>
    </view>

    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
      <view class="retry" @tap="loadGoods">
        <text class="retry-text">重新加载</text>
      </view>
    </view>

    <view v-else-if="list.length === 0" class="state">
      <text class="state-text">暂无商品，稍后再来看看吧</text>
    </view>

    <view v-else class="grid-wrap">
      <view
        v-for="item in list"
        :key="getItemId(item) || getTitle(item)"
        class="card"
        hover-class="card-hover"
        :hover-stay-time="80"
        @tap="goDetail(item)"
      >
        <view class="card-img-wrap">
          <image
            v-if="getCover(item)"
            class="card-img"
            :src="getCover(item)"
            mode="aspectFill"
            lazy-load
          />
          <view v-else class="card-img-placeholder">
            <text class="placeholder-text">暂无图片</text>
          </view>
          <view class="month-tag">
            <text class="month-tag-text">{{ getMonthLabel(item) }}</text>
          </view>
        </view>
        <view class="card-body">
          <text class="card-title">{{ getTitle(item) }}</text>
          <text class="card-price">{{ getPriceText(item) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(180deg, #fff5f0 0%, #f7efe8 45%, #f3e9e0 100%);
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.header {
  padding-left: 40rpx;
  padding-right: 40rpx;
  padding-bottom: 28rpx;
}

.header-title {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: #5c4033;
  letter-spacing: 2rpx;
}

.header-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #9a7b6a;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 48rpx;
}

.state-text {
  font-size: 28rpx;
  color: #8b7355;
  text-align: center;
}

.retry {
  margin-top: 32rpx;
  padding: 16rpx 40rpx;
  border-radius: 999rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(92, 64, 51, 0.08);
}

.retry-text {
  font-size: 28rpx;
  color: #c17f6a;
}

.grid-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 8rpx 28rpx 40rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 40rpx rgba(92, 64, 51, 0.07);
}

.card-hover {
  opacity: 0.92;
  transform: scale(0.98);
}

.card-img-wrap {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #faf6f3;
}

.card-img,
.card-img-placeholder {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.card-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0e8e2;
}

.placeholder-text {
  font-size: 24rpx;
  color: #b59b8c;
}

.month-tag {
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4rpx 12rpx rgba(92, 64, 51, 0.06);
}

.month-tag-text {
  font-size: 22rpx;
  color: #c17f6a;
  font-weight: 500;
}

.card-body {
  padding: 22rpx 20rpx 26rpx;
}

.card-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 28rpx;
  line-height: 1.45;
  color: #4a3428;
  font-weight: 500;
}

.card-price {
  display: block;
  margin-top: 14rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #d4896a;
  letter-spacing: 1rpx;
}
</style>
