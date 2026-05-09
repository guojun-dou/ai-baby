<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
    wx.cloud.init({
        traceUser: true,
    })
})
</script>

<style></style>
