<script setup lang="ts">
  import { onLaunch } from '@dcloudio/uni-app'

  import { useLayoutStore } from '@/stores/layout'

  onLaunch(() => {
    useLayoutStore().initFromSystem()

    wx.cloud.init({
      traceUser: true,
      env: 'cloud1-d0g6voe3bcd13bad7',
    })
  })
</script>

<style lang="scss">
  @import '@/styles/common.scss';

  page {
    --status-bar-height: 0px;
  }
</style>
