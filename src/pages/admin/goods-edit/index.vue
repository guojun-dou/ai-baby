<script setup lang="ts">
  import { onLoad } from '@dcloudio/uni-app'
  import { computed, reactive, ref } from 'vue'

  import { getAdminGoodsDetail, saveGoods } from '@/api/goods'
  import AdminImagePicker from '@/components/AdminImagePicker/index.vue'
  import PageLoading from '@/components/PageLoading/index.vue'
  import { useAdmin } from '@/composables/useAdmin'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { withUniLoading } from '@/utils/uni-loading'

  const CATEGORIES = ['米粉', '果泥', '面条', '粥品', '零食', '其他'] as const

  const { pageRootStyle } = usePageRootStyle()
  const { canAccess, loading: authLoading } = useAdmin()
  const pageLoading = usePageLoading()

  const goodsId = ref('')
  const pageTitle = ref('新增商品')
  const saving = ref(false)

  const showAuthLoading = computed(() => authLoading.value && !canAccess.value)
  const showDetailLoading = computed(() => pageLoading.loading.value)

  const form = reactive({
    title: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    stock: '',
    categoryIndex: 0,
    age: '',
    tagsText: '',
    desc: '',
    status: 1 as 0 | 1,
    sort: '0',
  })

  const imageFileIds = ref<string[]>([])

  function parseTags(text: string): string[] {
    return text
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }

  async function loadDetail(id: string) {
    await pageLoading.run(async () => {
      try {
        const d = await getAdminGoodsDetail(id)
        form.title = d.title
        form.subtitle = d.subtitle ?? ''
        form.price = String(d.price)
        form.originalPrice = d.originalPrice != null ? String(d.originalPrice) : ''
        form.stock = String(d.stock)
        const catIdx = CATEGORIES.findIndex((c) => c === d.category)
        form.categoryIndex = catIdx >= 0 ? catIdx : 0
        form.age = d.age
        form.tagsText = (d.tags ?? []).join('，')
        form.desc = d.desc
        form.status = d.status === 0 ? 0 : 1
        form.sort = String(d.sort ?? 0)
        imageFileIds.value = d.images.length > 0 ? [...d.images] : d.cover ? [d.cover] : []
      }
      catch (e) {
        console.error(e)
        uni.showToast({ title: '加载商品失败', icon: 'none' })
      }
    })
  }

  onLoad((options) => {
    const id = options?.id ? String(options.id).trim() : ''
    goodsId.value = id
    pageTitle.value = id ? '编辑商品' : '新增商品'
    if (id) {
      void loadDetail(id)
    }
  })

  function onCategoryChange(e: { detail: { value: string } }) {
    form.categoryIndex = Number(e.detail.value) || 0
  }

  function setStatus(status: 0 | 1) {
    form.status = status
  }

  function validate(): boolean {
    if (form.title.trim().length < 2) {
      uni.showToast({ title: '标题至少 2 个字', icon: 'none' })
      return false
    }
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0) {
      uni.showToast({ title: '请填写合法价格', icon: 'none' })
      return false
    }
    if (form.originalPrice.trim()) {
      const op = Number(form.originalPrice)
      if (!Number.isFinite(op) || op < 0) {
        uni.showToast({ title: '原价格式不正确', icon: 'none' })
        return false
      }
    }
    const stock = Number(form.stock)
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      uni.showToast({ title: '请填写整数库存', icon: 'none' })
      return false
    }
    if (!form.desc.trim()) {
      uni.showToast({ title: '请填写商品描述', icon: 'none' })
      return false
    }
    if (imageFileIds.value.length === 0) {
      uni.showToast({ title: '请上传商品图片', icon: 'none' })
      return false
    }
    return true
  }

  async function onSave() {
    if (!validate() || saving.value) {
      return
    }

    const images = [...imageFileIds.value]
    const cover = images[0] ?? ''
    const originalPriceRaw = form.originalPrice.trim()
    const payload = {
      goodsId: goodsId.value || undefined,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      desc: form.desc.trim(),
      price: Number(form.price),
      originalPrice: originalPriceRaw ? Number(originalPriceRaw) : undefined,
      stock: Math.floor(Number(form.stock)),
      category: CATEGORIES[form.categoryIndex] ?? '其他',
      age: form.age.trim() || '6月+',
      tags: parseTags(form.tagsText),
      images,
      cover,
      status: form.status,
      sort: Math.floor(Number(form.sort) || 0),
    }

    saving.value = true
    try {
      const res = await withUniLoading(() => saveGoods(payload), '保存中…')
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        if (!goodsId.value && res.goodsId) {
          goodsId.value = res.goodsId
          pageTitle.value = '编辑商品'
        }
        uni.navigateBack({ delta: 1 })
      }, 500)
    }
    catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : '保存失败'
      uni.showToast({ title: msg.length > 18 ? `${msg.slice(0, 15)}…` : msg, icon: 'none' })
    }
    finally {
      saving.value = false
    }
  }
</script>

<template>
  <view v-if="canAccess" class="page" :style="pageRootStyle">
    <view class="header">
      <text class="header-title">{{ pageTitle }}</text>
    </view>

    <PageLoading
      v-if="showDetailLoading"
      :show="true"
      text="加载商品…"
    />

    <scroll-view v-else class="scroll" scroll-y :show-scrollbar="false">
      <view class="section">
        <text class="section-label">基本信息</text>
        <view class="card">
          <view class="field">
            <text class="label required">商品标题</text>
            <input
              v-model="form.title"
              class="input"
              placeholder="请输入商品标题"
              :maxlength="40"
            />
          </view>
          <view class="field">
            <text class="label">副标题</text>
            <input
              v-model="form.subtitle"
              class="input"
              placeholder="列表辅助文案（选填）"
              :maxlength="60"
            />
          </view>
          <view class="field row">
            <view class="field-half">
              <text class="label required">价格</text>
              <input v-model="form.price" class="input" type="digit" placeholder="0.00" />
            </view>
            <view class="field-half">
              <text class="label">原价</text>
              <input
                v-model="form.originalPrice"
                class="input"
                type="digit"
                placeholder="划线价（选填）"
              />
            </view>
          </view>
          <view class="field row">
            <view class="field-half">
              <text class="label required">库存</text>
              <input v-model="form.stock" class="input" type="number" placeholder="0" />
            </view>
            <view class="field-half">
              <text class="label">排序</text>
              <input v-model="form.sort" class="input" type="number" placeholder="越小越靠前" />
            </view>
          </view>
          <view class="field">
            <text class="label">分类</text>
            <picker
              mode="selector"
              :range="CATEGORIES"
              :value="form.categoryIndex"
              @change="onCategoryChange"
            >
              <view class="picker-value">
                {{ CATEGORIES[form.categoryIndex] }}
              </view>
            </picker>
          </view>
          <view class="field">
            <text class="label">月龄</text>
            <input v-model="form.age" class="input" placeholder="如 6月+" :maxlength="20" />
          </view>
          <view class="field">
            <text class="label">标签</text>
            <input
              v-model="form.tagsText"
              class="input"
              placeholder="多个标签用逗号分隔，如 有机,高铁"
              :maxlength="80"
            />
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-label">商品描述</text>
        <view class="card">
          <textarea
            v-model="form.desc"
            class="textarea"
            placeholder="请输入商品详细描述"
            :maxlength="500"
            auto-height
          />
        </view>
      </view>

      <view class="section">
        <text class="section-label">商品图片</text>
        <view class="card card-picker">
          <AdminImagePicker v-model="imageFileIds" :limit="9" />
        </view>
      </view>

      <view class="section">
        <text class="section-label">上下架</text>
        <view class="card">
          <view class="status-row">
            <view
              class="status-opt"
              :class="{ 'status-opt--active': form.status === 1 }"
              @tap="setStatus(1)"
            >
              <text class="status-opt-text">上架</text>
            </view>
            <view
              class="status-opt"
              :class="{ 'status-opt--active': form.status === 0 }"
              @tap="setStatus(0)"
            >
              <text class="status-opt-text">下架</text>
            </view>
          </view>
        </view>
      </view>

      <view class="scroll-spacer" />
    </scroll-view>

    <view v-if="!showDetailLoading" class="bottom-bar">
      <view class="submit" hover-class="submit-hover" @tap="onSave">
        <text class="submit-text">{{ saving ? '保存中…' : '保存商品' }}</text>
      </view>
    </view>
  </view>

  <view v-else-if="showAuthLoading" class="page auth-page" :style="pageRootStyle">
    <PageLoading :show="true" text="校验权限中…" />
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
    display: flex;
    flex-direction: column;

    .header {
      padding: 0 $page-padding 20rpx;
      flex-shrink: 0;

      .header-title {
        font-size: 34rpx;
        font-weight: 600;
        color: $text-color;
      }
    }

    .loading-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      .loading-text {
        font-size: 28rpx;
        color: $text-secondary;
      }
    }

    .scroll {
      flex: 1;
      height: 0;
      width: 100%;
      padding: 0 $page-padding;
      box-sizing: border-box;

      .section {
        margin-bottom: $card-gap;

        .section-label {
          display: block;
          margin-bottom: 16rpx;
          font-size: 28rpx;
          font-weight: 600;
          color: $text-color;
        }

        .card {
          padding: 24rpx $page-padding;
          background-color: $card-bg;
          border-radius: $radius-md;
          box-shadow: $shadow;

          &.card-picker {
            padding: 20rpx;
          }

          .field {
            margin-bottom: 24rpx;

            &:last-child {
              margin-bottom: 0;
            }

            &.row {
              display: flex;
              flex-direction: row;
              gap: 20rpx;
            }

            .field-half {
              flex: 1;
              min-width: 0;
            }

            .label {
              display: block;
              margin-bottom: 12rpx;
              font-size: 26rpx;
              color: $text-secondary;

              &.required::before {
                content: '*';
                color: $primary-color;
                margin-right: 4rpx;
              }
            }

            .input {
              width: 100%;
              height: 80rpx;
              padding: 0 24rpx;
              font-size: 28rpx;
              color: $text-color;
              background-color: $page-bg;
              border-radius: $radius-sm;
              box-sizing: border-box;
            }

            .picker-value {
              height: 80rpx;
              line-height: 80rpx;
              padding: 0 24rpx;
              font-size: 28rpx;
              color: $text-color;
              background-color: $page-bg;
              border-radius: $radius-sm;
            }
          }

          .textarea {
            width: 100%;
            min-height: 180rpx;
            padding: 20rpx 24rpx;
            font-size: 28rpx;
            line-height: 1.5;
            color: $text-color;
            background-color: $page-bg;
            border-radius: $radius-sm;
            box-sizing: border-box;
          }

          .status-row {
            display: flex;
            flex-direction: row;
            gap: 20rpx;

            .status-opt {
              flex: 1;
              height: 72rpx;
              border-radius: 999rpx;
              background-color: $page-bg;
              display: flex;
              align-items: center;
              justify-content: center;

              .status-opt-text {
                font-size: 28rpx;
                color: $text-secondary;
              }

              &--active {
                background-color: $primary-color;
                box-shadow: $shadow;

                .status-opt-text {
                  color: #ffffff;
                  font-weight: 600;
                }
              }
            }
          }
        }
      }

      .scroll-spacer {
        height: calc(140rpx + env(safe-area-inset-bottom));
      }
    }

    .bottom-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 16rpx $page-padding;
      padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
      background-color: $card-bg;
      box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.05);
      z-index: 20;

      .submit {
        height: 88rpx;
        border-radius: 999rpx;
        background-color: $primary-color;
        box-shadow: $shadow;
        display: flex;
        align-items: center;
        justify-content: center;

        .submit-text {
          font-size: 30rpx;
          font-weight: 600;
          color: #ffffff;
        }
      }

      .submit-hover {
        opacity: 0.9;
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
