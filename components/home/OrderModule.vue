<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-14 02:54:42
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-15 23:38:17
 * @FilePath: \jc_mall_wx_uni\components\home\OrderModule.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <view class="order-module">
    <!-- 点单模块占位 -->
    <view class="order-row">
      <view class="order-item">
        <image v-if="pickupImage" :src="pickupImage" class="icon-placeholder" mode="aspectFill" @error="onImageError($event, 'pickup')" />
        <view v-else class="icon-placeholder"></view>
        <text class="label">自取</text>
      </view>
      <view class="order-item">
        <image v-if="deliveryImage" :src="deliveryImage" class="icon-placeholder" mode="aspectFill" @error="onImageError($event, 'delivery')" />
        <view v-else class="icon-placeholder"></view>
        <text class="label">配送</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'OrderModule',
  props: {
    pickupImageProp: {
      type: String,
      default: ''
    },
    deliveryImageProp: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      pickupImage: '', // 自取图片
      deliveryImage: '', // 配送图片
      loading: false
    }
  },
  created() {
    // 如果父组件通过 props 传入图片，则使用 props；否则从接口拉取
    if (this.pickupImageProp || this.deliveryImageProp) {
      this.pickupImage = this.getImageUrl(this.pickupImageProp || '')
      this.deliveryImage = this.getImageUrl(this.deliveryImageProp || '')
    } else {
      this.fetchImages()
    }
  },
  methods: {
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    fetchImages() {
      if (this.loading) return
      this.loading = true
      const url = `${BASE_URL}/api/home/images`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            const data = resp.data
            // 兼容后端返回 data 对象或 data.data
            const payload = data.data || data
            this.pickupImage = this.getImageUrl(payload.pickupImage || payload.pickup_image || '')
            this.deliveryImage = this.getImageUrl(payload.deliveryImage || payload.delivery_image || '')
          } else {
            console.warn('获取首页点单图片失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求首页点单图片失败', err)
        },
        complete: () => {
          this.loading = false
        }
      })
    },
    onImageError(e, type) {
      // 失败时不影响其它逻辑，保持占位样式
      if (type === 'pickup') this.pickupImage = ''
      if (type === 'delivery') this.deliveryImage = ''
    }
  }
}
</script>

<style scoped>
.order-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 12px;
}
.order-item {
  width: 46%;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}
.icon-placeholder {
  width: 100%;
  height: 94%;
  background: #f3f3f3;
  border-radius: 8px;
  margin-bottom: 6px;
}
.label {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>


