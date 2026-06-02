<script setup lang="ts">
  import type { CartItem } from '@/stores/cart'
  import type { GoodDetail } from '@/types/goods'
  import { onLoad, onShow } from '@dcloudio/uni-app'

  import { storeToRefs } from 'pinia'
  import { computed, reactive, ref, watch } from 'vue'
  import { getUserGoodsDetail } from '@/api/goods'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { useCartStore } from '@/stores/cart'
  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'
  import { getGoodsCover, getGoodsTitle } from '@/utils/goods-fields'
  import { withUniLoading } from '@/utils/uni-loading'

  interface OrdersCreateCloudResult {
    success?: boolean
    message?: string
    data?: { orderId?: string; status?: number; totalPrice?: number }
  }

  const MOCK_BY_ID: Record<string, GoodDetail> = {
    'mock-1': {
      id: 'mock-1',
      title: '有机高铁米粉 原味',
      desc: '二价铁易吸收，粉质细腻好冲泡。',
      price: 39.9,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['有机', '高铁'],
      age: '6月+',
      stock: 99,
    },
    'mock-2': {
      id: 'mock-2',
      title: '胡萝卜南瓜泥',
      desc: '无添加糖盐，开袋即食。',
      price: 12.8,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['果蔬'],
      age: '7月+',
      stock: 99,
    },
    'mock-3': {
      id: 'mock-3',
      title: '婴儿营养面条',
      desc: '短面易吞咽，钙铁锌强化。',
      price: 28,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['钙铁锌'],
      age: '8月+',
      stock: 99,
    },
    'mock-4': {
      id: 'mock-4',
      title: '西梅苹果泥',
      desc: '酸甜开胃，膳食纤维友好。',
      price: 15.5,
      cover: '/static/logo.svg',
      images: ['/static/logo.svg'],
      tags: ['膳食纤维'],
      age: '6月+',
      stock: 99,
    },
  }

  const DEFAULT_MOCK = MOCK_BY_ID['mock-1']!

  const { pageRootStyle } = usePageRootStyle()
  const pageLoading = usePageLoading()
  const showBuyNowLoading = computed(() => pageLoading.loading.value)

  const cartStore = useCartStore()
  const { cartList } = storeToRefs(cartStore)

  type CheckoutMode = 'cart' | 'buyNow'

  const mode = ref<CheckoutMode>('cart')
  const buyNowLines = ref<CartItem[]>([])
  const buyNowId = ref('')
  const buyNowQty = ref(1)

  const form = reactive({
    receiver: '',
    phone: '',
    address: '',
    deliveryIndex: 0,
    remark: '',
  })

  const deliveryOptions = ['尽快送达', '工作日 9:00-12:00', '工作日 14:00-18:00', '周末 9:00-18:00']

  const displayLines = computed<CartItem[]>(() => {
    if (mode.value === 'buyNow') {
      return buyNowLines.value
    }
    return cartList.value
  })

  const totalAmount = computed(() => displayLines.value.reduce((s, i) => s + i.price * i.count, 0))

  const totalText = computed(() => `¥${totalAmount.value.toFixed(2)}`)

  const lineCoverUrlMap = ref<Record<string, string>>({})

  function lineCoverDisplay(raw: string) {
    return resolveImageSrcForDisplay(raw, lineCoverUrlMap.value)
  }

  watch(
    () => displayLines.value.map((i) => i.cover || ''),
    async (covers) => {
      const ids = [...new Set(covers.map((c) => c.trim()).filter(isCloudFileId))]
      if (ids.length === 0) {
        lineCoverUrlMap.value = {}
        return
      }
      const m = await fetchCloudTempUrlMap(ids)
      lineCoverUrlMap.value = Object.fromEntries(m)
    },
    { deep: true, immediate: true }
  )

  function formatLine(price: number, count: number) {
    return `¥${(price * count).toFixed(2)}`
  }

  function onDeliveryChange(e: { detail: { value: string | number } }) {
    const i = Number(e.detail.value)
    if (!Number.isNaN(i)) {
      form.deliveryIndex = i
    }
  }

  async function prepareBuyNow(id: string, qty: number) {
    await pageLoading.run(async () => {
      try {
        const data = await getUserGoodsDetail(id)
        buyNowLines.value = [goodToLine(data, id, qty)]
      } catch (e) {
        console.error(e)
        applyBuyNowMock(id, qty)
      }
    })
  }

  function goodToLine(g: GoodDetail, id: string, qty: number): CartItem {
    const cover = getGoodsCover(g)
    const rawTitle = getGoodsTitle(g)
    const title = rawTitle === '未命名商品' ? '商品' : rawTitle
    const price = Number(g.price) || 0
    return {
      _id: String(g._id ?? g.id ?? id),
      title,
      price,
      cover,
      count: Math.max(1, qty),
    }
  }

  function applyBuyNowMock(id: string, qty: number) {
    const m = MOCK_BY_ID[id] ?? { ...DEFAULT_MOCK, id }
    buyNowLines.value = [goodToLine(m, id, qty)]
  }

  onLoad((options) => {
    const id = options?.id ? String(options.id) : ''
    const q = options?.qty ? Number(options.qty) : 1
    const qty = Number.isFinite(q) && q > 0 ? Math.floor(q) : 1

    if (id) {
      mode.value = 'buyNow'
      buyNowId.value = id
      buyNowQty.value = qty
      prepareBuyNow(id, qty)
    } else {
      mode.value = 'cart'
      cartStore.hydrateFromStorage()
    }
  })

  onShow(() => {
    cartStore.hydrateFromStorage()
  })

  function buildCreateOrderPayload() {
    return {
      goodsList: displayLines.value.map((line) => ({
        goodsId: line._id,
        title: line.title,
        price: line.price,
        count: line.count,
        cover: line.cover,
      })),
      totalPrice: totalAmount.value,
      username: form.receiver.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      remark: form.remark.trim(),
      deliveryTime: deliveryOptions[form.deliveryIndex],
    }
  }

  async function submitOrderMp(): Promise<void> {
    const payload = buildCreateOrderPayload()
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'orders',
        data: {
          action: 'create',
          ...payload,
        },
        success(res) {
          const result = res.result as OrdersCreateCloudResult
          if (result?.success) {
            resolve()
          } else {
            reject(new Error(result?.message ?? '下单失败'))
          }
        },
        fail(err) {
          reject(err)
        },
      })
    })
  }

  function openSubmitSuccessModal() {
    uni.showModal({
      title: '提交成功',
      content: `订单合计 ${totalText.value}，商家将在确认订单后与您联系，请保持联系方式畅通。`,
      showCancel: false,
      success() {
        if (mode.value === 'cart') {
          cartStore.clearCart()
        }
        uni.navigateBack({
          delta: 1,
          fail() {
            uni.reLaunch({ url: '/pages/index/index' })
          },
        })
      },
    })
  }

  function validate(): boolean {
    const name = form.receiver.trim()
    if (name.length < 2) {
      uni.showToast({ title: '请填写收货人（至少 2 个字）', icon: 'none' })
      return false
    }
    const phone = form.phone.trim()
    if (!/^1\d{10}$/.test(phone)) {
      uni.showToast({ title: '请输入 11 位手机号', icon: 'none' })
      return false
    }
    const addr = form.address.trim()
    if (addr.length < 5) {
      uni.showToast({ title: '请填写详细收货地址', icon: 'none' })
      return false
    }
    // if (form.deliveryIndex < 0 || form.deliveryIndex >= deliveryOptions.length) {
    //   uni.showToast({ title: '请选择配送时间', icon: 'none' })
    //   return false
    // }
    const remark = form.remark.trim()
    if (remark.length > 200) {
      uni.showToast({ title: '备注请勿超过 200 字', icon: 'none' })
      return false
    }
    return true
  }

  function handleSubmit() {
    if (pageLoading.busy.value) {
      uni.showToast({ title: '商品加载中', icon: 'none' })
      return
    }
    if (displayLines.value.length === 0) {
      uni.showToast({ title: '没有可下单的商品', icon: 'none' })
      return
    }
    if (!validate()) {
      return
    }

    console.warn('[order confirm]', buildCreateOrderPayload())

    // #ifdef MP-WEIXIN
    void withUniLoading(() => submitOrderMp(), '提交中…')
      .then(() => {
        openSubmitSuccessModal()
      })
      .catch((e: unknown) => {
        console.error(e)
        const msg =
          e && typeof e === 'object' && 'message' in e && typeof (e as Error).message === 'string'
            ? (e as Error).message
            : '下单失败，请重试'
        uni.showToast({ title: msg.length > 20 ? `${msg.slice(0, 17)}…` : msg, icon: 'none' })
      })
    // #endif

    // #ifndef MP-WEIXIN
    openSubmitSuccessModal()
    // #endif
  }

  function goCart() {
    uni.switchTab({
      url: '/pages/cart/cart',
      fail() {
        uni.showToast({ title: '页面未找到', icon: 'none' })
      },
    })
  }
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <PageLoading :show="showBuyNowLoading" text="加载商品…" />

    <template v-if="!showBuyNowLoading">
      <view v-if="displayLines.length === 0" class="empty">
        <text class="empty-title">暂无可结算商品</text>
        <text class="empty-desc">请先加入购物车或从商品页立即下单</text>
        <view class="empty-btn" @tap="goCart">
          <text class="empty-btn-text">去购物车</text>
        </view>
      </view>

      <template v-else>
        <!-- 提交按钮须在 form 内：微信小程序上 form-type="submit" 放在 form 外时 form 属性常不可靠 -->
        <form class="form-root" @submit.prevent="handleSubmit">
          <scroll-view class="scroll" scroll-y :show-scrollbar="false">
            <view class="section">
              <text class="section-label">收货信息</text>

              <view class="field">
                <text class="label required">收货人</text>
                <input
                  v-model="form.receiver"
                  class="input"
                  name="receiver"
                  type="text"
                  placeholder="请输入收货人姓名"
                  :maxlength="20"
                />
              </view>

              <view class="field">
                <text class="label required">手机号</text>
                <input
                  v-model="form.phone"
                  class="input"
                  name="phone"
                  type="number"
                  placeholder="11 位手机号码"
                  :maxlength="11"
                />
              </view>

              <view class="field field-column">
                <text class="label required">收货地址</text>
                <textarea
                  v-model="form.address"
                  class="textarea"
                  name="address"
                  placeholder="省市区、街道、门牌号等"
                  :maxlength="120"
                  auto-height
                />
              </view>

              <!-- <view class="field">
                <text class="label required">配送时间</text>
                <picker
                  mode="selector"
                  :range="deliveryOptions"
                  :value="form.deliveryIndex"
                  @change="onDeliveryChange"
                >
                  <view class="picker-value">
                    {{ deliveryOptions[form.deliveryIndex] }}
                  </view>
                </picker>
              </view> -->

              <view class="field field-column">
                <text class="label">订单备注</text>
                <textarea
                  v-model="form.remark"
                  class="textarea remark"
                  name="remark"
                  placeholder="口味、收货说明等（选填）"
                  :maxlength="200"
                  auto-height
                />
              </view>
            </view>

            <view class="section">
              <text class="section-label">商品清单</text>
              <view v-for="item in displayLines" :key="item._id" class="goods-row">
                <image
                  v-if="item.cover"
                  class="goods-cover"
                  :src="lineCoverDisplay(item.cover)"
                  mode="aspectFill"
                />
                <view v-else class="goods-cover goods-ph">
                  <text class="ph-text">无图</text>
                </view>
                <view class="goods-meta">
                  <text class="goods-title">{{ item.title }}</text>
                  <view class="goods-bottom">
                    <text class="goods-price">{{ formatLine(item.price, item.count) }}</text>
                    <text class="goods-count">x{{ item.count }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="total-bar">
              <text class="total-label">合计金额</text>
              <text class="total-num">{{ totalText }}</text>
            </view>

            <view class="scroll-spacer" />
          </scroll-view>

          <view class="bottom-bar">
            <button class="submit" form-type="submit">提交订单</button>
          </view>
        </form>
      </template>
    </template>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '确认订单',
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
    display: flex;
    flex-direction: column;

    .loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $page-padding;

      .loading-text {
        font-size: 28rpx;
        color: $text-secondary;
      }
    }

    .empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80rpx $page-padding;

      .empty-title {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-color;
      }

      .empty-desc {
        margin-top: 16rpx;
        font-size: 28rpx;
        color: $text-secondary;
        text-align: center;
      }

      .empty-btn {
        margin-top: 48rpx;
        padding: 20rpx 56rpx;
        border-radius: 999rpx;
        background-color: $primary-color;

        .empty-btn-text {
          font-size: 28rpx;
          font-weight: 600;
          color: #ffffff;
        }
      }
    }

    .form-root {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .scroll {
      flex: 1;
      padding: $card-gap $page-padding 0;
      box-sizing: border-box;
    }

    .section {
      background-color: $card-bg;
      border-radius: $radius-md;
      box-shadow: $shadow;
      padding: $page-padding;
      margin-bottom: $card-gap;
      box-sizing: border-box;

      .section-label {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: $text-color;
        margin-bottom: 20rpx;
      }

      .field {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 24rpx;
        gap: 16rpx;

        &.field-column {
          flex-direction: column;
          align-items: stretch;
        }

        .label {
          width: 160rpx;
          flex-shrink: 0;
          font-size: 28rpx;
          color: $text-color;

          &.required::before {
            content: '*';
            color: $primary-color;
            margin-right: 6rpx;
          }
        }

        &.field-column {
          align-items: stretch;

          .label {
            width: 100%;
            margin-bottom: 12rpx;
          }
        }

        .input {
          flex: 1;
          min-height: 72rpx;
          padding: 0 20rpx;
          font-size: 28rpx;
          color: $text-color;
          background-color: $page-bg;
          border-radius: $radius-sm;
          box-sizing: border-box;
        }

        .textarea {
          width: 100%;
          min-height: 140rpx;
          padding: 20rpx;
          font-size: 28rpx;
          color: $text-color;
          background-color: $page-bg;
          border-radius: $radius-sm;
          box-sizing: border-box;

          &.remark {
            min-height: 120rpx;
          }
        }

        .picker-value {
          flex: 1;
          min-height: 72rpx;
          line-height: 72rpx;
          padding: 0 20rpx;
          font-size: 28rpx;
          color: $text-color;
          background-color: $page-bg;
          border-radius: $radius-sm;
          box-sizing: border-box;
        }
      }

      .goods-row {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 20rpx;
        padding: 16rpx 0;
        border-bottom: 2rpx solid $border-color;

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        &:first-of-type {
          padding-top: 0;
        }

        .goods-cover {
          width: 120rpx;
          height: 120rpx;
          border-radius: $radius-sm;
          flex-shrink: 0;
          background-color: $border-color;
        }

        .goods-ph {
          display: flex;
          align-items: center;
          justify-content: center;

          .ph-text {
            font-size: 22rpx;
            color: $text-secondary;
          }
        }

        .goods-meta {
          flex: 1;
          min-width: 0;

          .goods-title {
            font-size: 28rpx;
            color: $text-color;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
          }

          .goods-bottom {
            margin-top: 12rpx;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;

            .goods-price {
              font-size: 28rpx;
              font-weight: 600;
              color: $primary-color;
            }

            .goods-count {
              font-size: 26rpx;
              color: $text-secondary;
            }
          }
        }
      }
    }

    .total-bar {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 28rpx $page-padding;
      margin-left: -$page-padding;
      margin-right: -$page-padding;
      margin-bottom: $card-gap;
      background-color: $card-bg;
      border-radius: $radius-md;
      box-shadow: $shadow;
      box-sizing: border-box;

      .total-label {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-color;
      }

      .total-num {
        font-size: 36rpx;
        font-weight: 600;
        color: $primary-color;
      }
    }

    .scroll-spacer {
      height: calc(140rpx + env(safe-area-inset-bottom));
    }

    .bottom-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      padding: 16rpx $page-padding;
      padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
      background-color: $card-bg;
      box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.05);
      box-sizing: border-box;

      .submit {
        width: 100%;
        height: 88rpx;
        line-height: 88rpx;
        border-radius: 999rpx;
        font-size: 30rpx;
        font-weight: 600;
        color: #ffffff;
        background-color: $primary-color;
        border: none;

        &::after {
          border: none;
        }
      }
    }
  }
</style>
