<script setup lang="ts">
  import { ref, watch } from 'vue'

  import {
    fetchCloudTempUrlMap,
    isCloudFileId,
    resolveImageSrcForDisplay,
  } from '@/utils/cloud-file'
  import { uploadGoodsImages } from '@/utils/cloud-upload'
  import { withUniLoading } from '@/utils/uni-loading'

  defineOptions({
    name: 'AdminImagePicker',
  })

  const props = withDefaults(
    defineProps<{
      limit?: number
    }>(),
    {
      limit: 9,
    },
  )

  const imageIds = defineModel<string[]>({ default: () => [] })

  const uploading = ref(false)
  const coverUrlMap = ref<Record<string, string>>({})

  async function syncDisplayUrls(fileIds: string[]) {
    const cloudIds = fileIds.filter((id) => isCloudFileId(id))
    if (cloudIds.length === 0) {
      return
    }
    const m = await fetchCloudTempUrlMap(cloudIds)
    coverUrlMap.value = { ...coverUrlMap.value, ...Object.fromEntries(m) }
  }

  watch(
    imageIds,
    (ids) => {
      void syncDisplayUrls(ids ?? [])
    },
    { immediate: true, deep: true },
  )

  function displaySrc(fileId: string) {
    return resolveImageSrcForDisplay(fileId, coverUrlMap.value)
  }

  function onChoose() {
    if (uploading.value) {
      return
    }
    const list = imageIds.value ?? []
    const remain = props.limit - list.length
    if (remain <= 0) {
      uni.showToast({ title: `最多 ${props.limit} 张`, icon: 'none' })
      return
    }

    uni.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const paths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : []
        if (paths.length === 0) {
          return
        }
        uploading.value = true
        void withUniLoading(() => uploadGoodsImages(paths), '上传中…')
          .then((fileIds) => {
            imageIds.value = [...list, ...fileIds]
          })
          .catch((e: unknown) => {
            console.error(e)
            uni.showToast({ title: '图片上传失败', icon: 'none' })
          })
          .finally(() => {
            uploading.value = false
          })
      },
    })
  }

  function onRemove(index: number) {
    const next = [...(imageIds.value ?? [])]
    next.splice(index, 1)
    imageIds.value = next
  }
</script>

<template>
  <view class="picker">
    <view class="grid">
      <view
        v-for="(fileId, index) in imageIds"
        :key="`${fileId}-${index}`"
        class="item"
      >
        <image
          v-if="displaySrc(fileId)"
          class="img"
          :src="displaySrc(fileId)"
          mode="aspectFill"
        />
        <view v-else class="img img-ph">
          <text class="ph-text">图</text>
        </view>
        <view class="del" @tap.stop="onRemove(index)">
          <text class="del-icon">×</text>
        </view>
      </view>

      <view
        v-if="(imageIds?.length ?? 0) < limit"
        class="item add"
        hover-class="add-hover"
        @tap="onChoose"
      >
        <text class="add-plus">+</text>
        <text class="add-text">{{ uploading ? '上传中' : '添加图片' }}</text>
      </view>
    </view>
    <text class="hint">上传至云存储，保存 cloud fileID（首张为主图）</text>
  </view>
</template>

<style scoped lang="scss">
  .picker {
    width: 100%;
    box-sizing: border-box;

    .grid {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;

      .item {
        position: relative;
        width: 200rpx;
        height: 200rpx;
        margin-right: 16rpx;
        margin-bottom: 16rpx;
        border-radius: $radius-sm;
        overflow: hidden;

        .img {
          width: 100%;
          height: 100%;
        }

        .img-ph {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: $border-color;

          .ph-text {
            font-size: 24rpx;
            color: $text-secondary;
          }
        }

        .del {
          position: absolute;
          right: 8rpx;
          top: 8rpx;
          width: 40rpx;
          height: 40rpx;
          border-radius: 999rpx;
          background-color: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;

          .del-icon {
            font-size: 28rpx;
            color: #ffffff;
            line-height: 1;
          }
        }
      }

      .add {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba($primary-color, 0.06);
        border: 2rpx dashed rgba($primary-color, 0.35);
        box-sizing: border-box;

        .add-plus {
          font-size: 48rpx;
          line-height: 1;
          color: $primary-color;
          font-weight: 300;
        }

        .add-text {
          margin-top: 8rpx;
          font-size: 22rpx;
          color: $text-secondary;
        }
      }

      .add-hover {
        opacity: 0.9;
      }
    }

    .hint {
      display: block;
      margin-top: 8rpx;
      font-size: 24rpx;
      color: $text-secondary;
    }
  }
</style>
