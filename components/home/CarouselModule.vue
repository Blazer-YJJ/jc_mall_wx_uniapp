<template>
  <view class="carousel-module">
    <swiper class="carousel-swiper" indicator-dots :autoplay="true" interval="4000" duration="600" circular>
      <swiper-item v-for="(b, idx) in banners" :key="b.id || idx" @click="onBannerClick(b)">
        <image :src="b.image" class="carousel-image" mode="aspectFill" @error="onImageError($event, idx)" />
      </swiper-item>
      <view v-if="!banners.length" class="carousel-placeholder">轮播占位</view>
    </swiper>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'CarouselModule',
  data() {
    return {
      banners: [],
      loading: false
    }
  },
  created() {
    this.fetchBanners()
  },
  methods: {
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    fetchBanners() {
      if (this.loading) return
      this.loading = true
      const url = `${BASE_URL}/api/banner/list`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data && resp.data.list) {
            this.banners = (resp.data.list || []).map((item) => {
              return {
                id: item.id,
                title: item.title,
                image: this.getImageUrl(item.banner_url || item.bannerUrl || item.banner || ''),
                productId: item.product_id || item.productId || null
              }
            })
          } else {
            console.warn('获取轮播数据失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求轮播数据失败', err)
        },
        complete: () => {
          this.loading = false
        }
      })
    },
    onImageError(e, idx) {
      // 替换为占位或清空，防止破图
      if (this.banners[idx]) this.banners[idx].image = ''
    },
    onBannerClick(banner) {
      // 若banner关联商品，跳转商品详情（预留）
      if (banner && banner.productId) {
        // uni.navigateTo({ url: `/pages/product/product?id=${banner.productId}` })
      }
    }
  }
}
</script>

<style scoped>
.carousel-swiper {
  height: 160px;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
}
.carousel-image {
  width: 100%;
  height: 100%;
  background: #f6f6f6;
}
.carousel-placeholder {
  height: 160px;
  background: linear-gradient(90deg, #f8f0e6, #fff);
  border-radius: 8px;
  margin: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d2691e;
}
</style>


