<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-14 02:55:09
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-18 04:10:51
 * @FilePath: \jc_mall_wx_uni\components\home\RecommendedProducts.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <view class="recommended-module">
    <!-- 模块标题 -->
    <view class="module-header">
      <text class="module-title">新品推荐</text>
    </view>
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>正在加载推荐商品...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="fetchRecommendedProducts" class="retry-btn">重试</button>
    </view>

    <!-- 推荐商品列表 -->
    <view v-else class="grid">
      <view
        class="card"
        v-for="product in recommendedProducts"
        :key="product.id"
        @click="openProduct(product)"
      >
        <!-- 商品图片 -->
        <view class="img-container">
          <image
            class="img"
            :src="product.image"
            mode="aspectFit"
            @error="handleImageError(product)"
          />
        </view>

        <!-- 商品信息 -->
        <view class="product-info">
          <text class="name">{{ product.productName }}</text>
          <text class="recommend-reason">{{ product.recommend_reason }}</text>
          <text class="price">¥{{ product.productPrice }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'RecommendedProducts',
  data() {
    return {
      // 推荐商品列表
      recommendedProducts: [],
      // 加载状态
      loading: true,
      // 错误信息
      error: null
    }
  },
  mounted() {
    // 组件挂载时获取推荐商品数据
    this.fetchRecommendedProducts()
  },
  methods: {
    /**
     * 将图片地址规范为绝对地址：若已包含协议则原样返回，否则补充 BASE_URL
     * @param {string} url
     * @returns {string}
     */
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    /**
     * 获取推荐商品数据
     */
    async fetchRecommendedProducts() {
      try {
        this.loading = true
        this.error = null

        // 调用推荐商品 API
        const response = await uni.request({
          url: `${BASE_URL}/api/activity/new`,
          method: 'GET'
        })

        if (response.statusCode === 200 && response.data.code === 200) {
          // 请求成功，规范化并更新商品列表（兼容后端返回不同字段名）
          const list = (response.data.data || []).map((p) => {
            const img = this.getImageUrl(p.productImage || p.product_image || p.image || '')
            return Object.assign({}, p, { image: img })
          })
          this.recommendedProducts = list
        } else {
          // 请求失败，设置错误信息
          this.error = response.data.message || '获取推荐商品失败'
        }
      } catch (err) {
        // 网络错误或其他异常
        console.error('获取推荐商品失败:', err)
        this.error = '网络异常，请稍后重试'
      } finally {
        this.loading = false
      }
    },

    /**
     * 处理图片加载错误
     */
    handleImageError(item) {
      console.warn('商品图片加载失败:', item)
      // 图片加载失败时清空该商品的图片字段，保持占位样式
      if (item) item.image = ''
    }
    ,
    // 跳转到商品详情页
    openProduct(product) {
      if (!product || !product.product_id && !product.id) return
      const id = product.product_id || product.id
      uni.navigateTo({ url: `/pages/product/product?id=${id}` })
    }
  }
}
</script>

<style scoped>
.recommended-module {
  background: #f8f8f8;
}

/* 加载状态样式 */
.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
}

/* 错误状态样式 */
.error {
  text-align: center;
  padding: 40px 20px;
  color: #f56c6c;
  font-size: 14px;
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
}

/* 商品网格布局 */
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 12px;
}

/* 商品卡片样式 */
.card {
  width: 46%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card:active {
  transform: scale(0.98);
}

/* 商品图片容器 */
.img-container {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 商品信息区域 */
.product-info {
  padding: 10px;
}

.name {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-reason {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  color: #e74c3c;
  font-size: 16px;
  font-weight: bold;
}

.module-header {
  padding: 12px;
  padding-bottom: 6px;
}
.module-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>


