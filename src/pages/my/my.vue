<script setup lang="ts">
  import { onShow } from '@dcloudio/uni-app'
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'

  import { usePageRootStyle } from '@/composables/usePageRootStyle'
  import { useAdminStore } from '@/stores/admin'
  import { useUserStore } from '@/stores/user'

  const { pageRootStyle } = usePageRootStyle()
  const userStore = useUserStore()
  const adminStore = useAdminStore()
  const { userInfo } = storeToRefs(userStore)
  const { canShowAdminEntry } = storeToRefs(adminStore)

  /** 与 Store 字段对齐：nickName / avatarUrl */
  const displayNickname = computed(() => {
    const n = userInfo.value?.nickName
    if (n != null && String(n).trim() !== '') {
      return String(n).trim()
    }
    return '亲爱的宝妈'
  })

  const displayAvatar = computed(() => {
    const u = userInfo.value?.avatarUrl
    return u != null ? String(u).trim() : ''
  })

  onShow(() => {
    userStore.hydrateFromStorage()
    void adminStore.fetchAdminStatus()
  })

  function goAdmin() {
    uni.navigateTo({
      url: '/pages/admin/index/index',
      fail() {
        uni.showToast({ title: '页面未找到', icon: 'none' })
      },
    })
  }

  function goOrders() {
    uni.switchTab({
      url: '/pages/order/list',
      fail() {
        uni.showToast({ title: '页面未找到', icon: 'none' })
      },
    })
  }

  function goAddress() {
    uni.navigateTo({
      url: '/pages/address/address',
      fail() {
        uni.showToast({ title: '页面未找到', icon: 'none' })
      },
    })
  }

  function showAbout() {
    uni.showModal({
      title: '关于 AI-Baby',
      content:
        'AI-Baby 专注母婴辅食与好物推荐，用温柔简洁的体验，陪伴宝宝每一口成长。\n\n版本：1.0.0',
      showCancel: false,
    })
  }

  // #ifndef MP-WEIXIN
  function contactFallback() {
    uni.showModal({
      title: '联系客服',
      content: '请在微信小程序内使用客服会话，或稍后在设置中留下联系方式。',
      showCancel: false,
    })
  }
  // #endif
</script>

<template>
  <view class="page" :style="pageRootStyle">
    <view class="hero">
      <view class="hero-inner">
        <image v-if="displayAvatar" class="avatar" :src="displayAvatar" mode="aspectFill" />
        <view v-else class="avatar avatar-placeholder">
          <text class="avatar-letter">宝</text>
        </view>
        <view class="hero-text">
          <text class="nickname">{{ displayNickname }}</text>
          <text class="welcome">愿你与宝宝每天都暖暖的</text>
        </view>
      </view>
    </view>

    <view v-if="canShowAdminEntry" class="card menu">
      <view class="cell" hover-class="cell-hover" @tap="goAdmin">
        <view class="icon-text cell-main">
          <uni-icons type="gear" :size="22" color="#ff8ba7" />
          <text class="cell-title">管理后台</text>
        </view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="card menu">
      <view class="cell" hover-class="cell-hover" @tap="goOrders">
        <view class="icon-text cell-main">
          <uni-icons type="list" :size="22" color="#ff8ba7" />
          <text class="cell-title">我的订单</text>
        </view>
        <text class="cell-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="cell" hover-class="cell-hover" @tap="goAddress">
        <view class="icon-text cell-main">
          <uni-icons type="location" :size="22" color="#ff8ba7" />
          <text class="cell-title">地址管理</text>
        </view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="card menu">
      <!-- #ifdef MP-WEIXIN -->
      <button class="cell cell-btn" open-type="contact">
        <view class="icon-text cell-main">
          <uni-icons type="chat" :size="22" color="#ff8ba7"></uni-icons>
          <text class="cell-title">联系客服</text>
        </view>
        <text class="cell-arrow">›</text>
      </button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="cell" hover-class="cell-hover" @tap="contactFallback">
        <view class="icon-text cell-main">
          <uni-icons type="chat" :size="22" color="#ff8ba7" />
          <text class="cell-title">联系客服</text>
        </view>
        <text class="cell-arrow">›</text>
      </view>
      <!-- #endif -->
      <view class="divider" />
      <view class="cell" hover-class="cell-hover" @tap="showAbout">
        <view class="icon-text cell-main">
          <uni-icons type="info" :size="22" color="#999999" />
          <text class="cell-title">关于我们</text>
        </view>
        <text class="cell-arrow">›</text>
      </view>
    </view>

    <view class="footer-hint">
      <text class="hint-text">AI-Baby · 温柔之选</text>
    </view>
  </view>
</template>

<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的',
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
    // padding: $card-gap $page-padding calc(48rpx + env(safe-area-inset-bottom));

    .hero {
      margin-bottom: $card-gap;
      border-radius: $radius-md;
      overflow: hidden;
      background-color: $card-bg;
      box-shadow: $shadow;

      .hero-inner {
        padding: 40rpx $page-padding 36rpx;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 28rpx;
        border-left: 8rpx solid $primary-color;
      }

      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 999rpx;
        flex-shrink: 0;
        border: 4rpx solid rgba($primary-color, 0.35);
        box-sizing: border-box;
      }

      .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba($primary-color, 0.12);

        .avatar-letter {
          font-size: 44rpx;
          font-weight: 600;
          color: $primary-color;
        }
      }

      .hero-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 12rpx;

        .nickname {
          font-size: 34rpx;
          font-weight: 600;
          color: $text-color;
        }

        .welcome {
          font-size: 24rpx;
          color: $text-secondary;
          line-height: 1.4;
        }
      }
    }

    .card {
      background-color: $card-bg;
      border-radius: $radius-md;
      box-shadow: $shadow;
      overflow: hidden;
      margin-bottom: $card-gap;

      &.menu {
        padding: 0 0;
      }

      .divider {
        height: 2rpx;
        margin-left: $page-padding;
        background-color: $border-color;
      }

      .cell {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 32rpx $page-padding;
        box-sizing: border-box;

        .cell-main {
          flex: 1;
          min-width: 0;
        }

        .cell-title {
          font-size: 30rpx;
          color: $text-color;
        }

        .cell-arrow {
          font-size: 36rpx;
          color: $text-secondary;
          font-weight: 300;
        }
      }

      .cell-hover {
        background-color: $page-bg;
      }

      .cell-btn {
        margin: 0;
        padding: 32rpx $page-padding;
        width: 100%;
        height: auto;
        line-height: normal;
        background-color: transparent;
        border: none;
        border-radius: 0;
        text-align: left;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        &::after {
          border: none;
        }
      }
    }

    .footer-hint {
      margin-top: 24rpx;
      display: flex;
      justify-content: center;

      .hint-text {
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
  }
</style>
