<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'

import { usePageRootStyle } from '@/composables/usePageRootStyle'

export interface AddressItem {
  id: string
  name: string
  phone: string
  detail: string
  isDefault: boolean
}

const { pageRootStyle } = usePageRootStyle()

const STORAGE_KEY = 'address_list'

const addresses = ref<AddressItem[]>([])
const showForm = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  phone: '',
  detail: '',
  isDefault: false,
})

const navTitle = computed(() => {
  if (!showForm.value)
    return '地址管理'
  return editingId.value ? '编辑地址' : '新增地址'
})

function loadList(): AddressItem[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!Array.isArray(raw))
      return []
    return raw.filter(
      (x): x is AddressItem =>
        x !== null &&
        typeof x === 'object' &&
        typeof (x as AddressItem).id === 'string',
    )
  }
  catch {
    return []
  }
}

function persist() {
  try {
    uni.setStorageSync(STORAGE_KEY, addresses.value)
  }
  catch (e) {
    console.error(e)
  }
}

function normalizeDefaults(list: AddressItem[]) {
  if (list.length === 0)
    return
  const withDef = list.filter((i) => i.isDefault)
  if (withDef.length === 0)
    list[0]!.isDefault = true
  else if (withDef.length > 1) {
    const keepId = withDef[0]!.id
    list.forEach((i) => {
      i.isDefault = i.id === keepId
    })
  }
}

function refresh() {
  addresses.value = loadList()
  normalizeDefaults(addresses.value)
  persist()
}

const sortedList = computed(() => {
  const list = [...addresses.value]
  list.sort((a, b) => {
    if (a.isDefault !== b.isDefault)
      return a.isDefault ? -1 : 1
    return 0
  })
  return list
})

function resetForm() {
  form.name = ''
  form.phone = ''
  form.detail = ''
  form.isDefault = false
}

function applyNavTitle() {
  uni.setNavigationBarTitle({ title: navTitle.value })
}

function openAdd() {
  editingId.value = null
  resetForm()
  form.isDefault = addresses.value.length === 0
  showForm.value = true
  applyNavTitle()
}

function openEdit(item: AddressItem) {
  editingId.value = item.id
  form.name = item.name
  form.phone = item.phone
  form.detail = item.detail
  form.isDefault = item.isDefault
  showForm.value = true
  applyNavTitle()
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
  applyNavTitle()
}

function onDefaultSwitch(e: { detail: { value: boolean } }) {
  form.isDefault = e.detail.value
}

function validate(): boolean {
  const name = form.name.trim()
  if (name.length < 2) {
    uni.showToast({ title: '请填写收货人（至少 2 个字）', icon: 'none' })
    return false
  }
  const phone = form.phone.trim()
  if (!/^1\d{10}$/.test(phone)) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' })
    return false
  }
  const detail = form.detail.trim()
  if (detail.length < 5) {
    uni.showToast({ title: '详细地址至少 5 个字', icon: 'none' })
    return false
  }
  return true
}

function saveAddress() {
  if (!validate())
    return

  const name = form.name.trim()
  const phone = form.phone.trim()
  const detail = form.detail.trim()
  const list = addresses.value.map((i) => ({ ...i }))

  if (editingId.value) {
    const idx = list.findIndex((i) => i.id === editingId.value)
    if (idx < 0) {
      uni.showToast({ title: '地址不存在', icon: 'none' })
      return
    }
    list[idx] = {
      ...list[idx]!,
      name,
      phone,
      detail,
      isDefault: form.isDefault,
    }
  }
  else {
    const id = `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    list.push({
      id,
      name,
      phone,
      detail,
      isDefault: form.isDefault,
    })
  }

  if (form.isDefault) {
    const targetId = editingId.value ?? list[list.length - 1]!.id
    list.forEach((i) => {
      i.isDefault = i.id === targetId
    })
  }

  normalizeDefaults(list)
  addresses.value = list
  persist()
  uni.showToast({ title: '已保存', icon: 'success' })
  cancelForm()
}

function setDefault(item: AddressItem) {
  const list = addresses.value.map((i) => ({
    ...i,
    isDefault: i.id === item.id,
  }))
  addresses.value = list
  persist()
  uni.showToast({ title: '已设为默认', icon: 'none' })
}

function confirmDelete(item: AddressItem) {
  uni.showModal({
    title: '删除地址',
    content: '确认删除该收货地址？',
    success(res) {
      if (!res.confirm)
        return
      let list = addresses.value.filter((i) => i.id !== item.id)
      normalizeDefaults(list)
      addresses.value = list
      persist()
      uni.showToast({ title: '已删除', icon: 'none' })
    },
  })
}

onShow(() => {
  refresh()
  if (!showForm.value)
    applyNavTitle()
})
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <!-- 列表 -->
    <view v-if="!showForm" class="list-wrap">
      <view v-if="sortedList.length === 0" class="empty">
        <text class="empty-text">还没有收货地址</text>
        <text class="empty-sub">添加后可快速下单</text>
      </view>

      <scroll-view
        v-else
        class="scroll"
        scroll-y
        :show-scrollbar="false"
      >
        <view
          v-for="item in sortedList"
          :key="item.id"
          class="card"
        >
          <view class="card-head">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
            <view v-if="item.isDefault" class="badge">
              <text class="badge-text">默认</text>
            </view>
          </view>
          <text class="detail">{{ item.detail }}</text>
          <view class="card-actions">
            <text
              v-if="!item.isDefault"
              class="link"
              @tap="setDefault(item)"
            >设为默认</text>
            <text class="link" @tap="openEdit(item)">编辑</text>
            <text class="link danger" @tap="confirmDelete(item)">删除</text>
          </view>
        </view>
        <view class="scroll-spacer" />
      </scroll-view>

      <view class="fab-wrap safe-bottom">
        <view class="fab" hover-class="fab-hover" @tap="openAdd">
          <text class="fab-text">新增地址</text>
        </view>
      </view>
    </view>

    <!-- 表单 -->
    <view v-else class="form-wrap">
      <form class="form" @submit.prevent="saveAddress">
        <view class="field">
          <text class="label required">收货人</text>
          <input
            v-model="form.name"
            class="input"
            name="name"
            type="text"
            placeholder="请输入收货人姓名"
            :maxlength="20"
          >
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
          >
        </view>
        <view class="field field-stack">
          <text class="label required">详细地址</text>
          <textarea
            v-model="form.detail"
            class="textarea"
            name="detail"
            placeholder="街道、小区、楼栋与门牌号"
            :maxlength="120"
            auto-height
          />
        </view>
        <view class="field field-row">
          <text class="label">默认地址</text>
          <switch
            :checked="form.isDefault"
            color="#ff8ba7"
            @change="onDefaultSwitch"
          />
        </view>

        <view class="form-actions">
          <view class="btn ghost" @tap="cancelForm">
            <text class="btn-text ghost-text">取消</text>
          </view>
          <button class="btn primary" form-type="submit">
            <text class="btn-text primary-text">保存</text>
          </button>
        </view>
      </form>
    </view>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '地址管理',
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

  .list-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx $page-padding;

    .empty-text {
      font-size: 30rpx;
      color: $text-color;
      font-weight: 500;
    }

    .empty-sub {
      margin-top: 12rpx;
      font-size: 26rpx;
      color: $text-secondary;
    }
  }

  .scroll {
    flex: 1;
    height: 0;
    padding: $card-gap $page-padding 0;
    box-sizing: border-box;
  }

  .card {
    background-color: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow;
    padding: $page-padding;
    margin-bottom: $card-gap;
    box-sizing: border-box;

    .card-head {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 16rpx;

      .name {
        font-size: 30rpx;
        font-weight: 600;
        color: $text-color;
      }

      .phone {
        font-size: 28rpx;
        color: $text-secondary;
      }

      .badge {
        padding: 4rpx 14rpx;
        border-radius: 999rpx;
        background-color: rgba($primary-color, 0.12);

        .badge-text {
          font-size: 22rpx;
          color: $primary-color;
          font-weight: 500;
        }
      }
    }

    .detail {
      display: block;
      margin-top: 16rpx;
      font-size: 28rpx;
      line-height: 1.5;
      color: $text-color;
    }

    .card-actions {
      margin-top: 24rpx;
      padding-top: 20rpx;
      border-top: 2rpx solid $border-color;
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 24rpx;

      .link {
        font-size: 26rpx;
        color: $primary-color;

        &.danger {
          color: $text-secondary;
        }
      }
    }
  }

  .scroll-spacer {
    height: 24rpx;
  }

  .fab-wrap {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    padding: 16rpx $page-padding;
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
    background-color: rgba($page-bg, 0.96);
    box-sizing: border-box;

    .fab {
      height: 88rpx;
      border-radius: 999rpx;
      background-color: $primary-color;
      display: flex;
      align-items: center;
      justify-content: center;

      .fab-text {
        font-size: 30rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }

    .fab-hover {
      opacity: 0.92;
    }
  }

  .safe-bottom {
    padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  }

  .form-wrap {
    padding: $card-gap $page-padding calc(32rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  .form {
    background-color: $card-bg;
    border-radius: $radius-md;
    box-shadow: $shadow;
    padding: $page-padding;
    box-sizing: border-box;

    .field {
      margin-bottom: 28rpx;

      .label {
        display: block;
        margin-bottom: 12rpx;
        font-size: 28rpx;
        color: $text-color;

        &.required::before {
          content: '*';
          color: $primary-color;
          margin-right: 6rpx;
        }
      }

      &.field-stack .label {
        margin-bottom: 12rpx;
      }

      &.field-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        .label {
          margin-bottom: 0;
        }
      }

      .input {
        width: 100%;
        min-height: 80rpx;
        padding: 0 20rpx;
        font-size: 28rpx;
        color: $text-color;
        background-color: $page-bg;
        border-radius: $radius-sm;
        box-sizing: border-box;
      }

      .textarea {
        width: 100%;
        min-height: 160rpx;
        padding: 20rpx;
        font-size: 28rpx;
        color: $text-color;
        background-color: $page-bg;
        border-radius: $radius-sm;
        box-sizing: border-box;
      }
    }

    .form-actions {
      margin-top: 16rpx;
      display: flex;
      flex-direction: row;
      gap: 24rpx;

      .btn {
        flex: 1;
        height: 88rpx;
        border-radius: 999rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0;
        line-height: normal;

        &::after {
          border: none;
        }

        &.ghost {
          background-color: $page-bg;
          border: 2rpx solid $border-color;
        }

        &.primary {
          background-color: $primary-color;
        }

        .btn-text {
          font-size: 30rpx;
          font-weight: 600;
        }

        .ghost-text {
          color: $text-color;
        }

        .primary-text {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
