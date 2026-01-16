<template>
  <view class="product-page">
    <view v-if="loading" class="loading">正在加载...</view>
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="fetchProduct">重试</button>
    </view>

    <view v-else class="detail">
      <image :src="product.image" class="product-image" mode="aspectFill" />
      <view class="info">
        <view class="header">
          <text class="title">{{ product.name }}</text>
          <view class="favorite-btn" :class="{ 'favorited': isFavorited }" @click="toggleFavorite">
            <text class="icon">{{ isFavorited ? '♥' : '♡' }}</text>
            <text class="text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
          </view>
        </view>
        <text class="category">分类：{{ product.categoryName || product.category_name || '' }}</text>
        <text class="price">¥{{ product.price }}</text>
        <text class="stock">库存：{{ product.stock }}</text>
        <view class="desc">
          <text>{{ product.description }}</text>
        </view>
      </view>
    </view>
  <!-- 底部操作栏：数量 + 加入购物车 -->
  <view class="action-bar">
    <view class="qty-control">
      <view class="qty-btn" @click="decreaseQuantity">-</view>
      <view class="qty-value">{{ quantity }}</view>
      <view class="qty-btn" @click="increaseQuantity">+</view>
    </view>
    <view class="add-cart-btn" @click="addToCart">加入购物车</view>
  </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'Product',
  data() {
    return {
      product: {},
      loading: true,
      error: null,
      productId: null,
      // 购买数量，默认 1
      quantity: 1,
      // 收藏状态
      isFavorited: false,
      // 收藏状态加载中
      favoriteLoading: false
    }
  },
  onLoad(options) {
    // 获取路由参数 id 或者 productId
    this.productId = options.id || options.productId || null
    if (this.productId) {
      this.fetchProduct()
    } else {
      this.loading = false
      this.error = '未提供商品 ID'
    }
  },
  methods: {
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    async fetchProduct() {
      if (!this.productId) {
        this.error = '无效的商品 ID'
        return
      }
      try {
        this.loading = true
        this.error = null
        const response = await uni.request({
          url: `${BASE_URL}/api/product/${this.productId}`,
          method: 'GET'
        })
        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const p = response.data.data || {}
          // 规范图片字段
          p.image = this.getImageUrl(p.image || p.productImage || p.product_image || '')
          this.product = p
          // 检查收藏状态
          this.checkFavoriteStatus()
        } else {
          this.error = (response.data && response.data.message) || '获取商品详情失败'
        }
      } catch (err) {
        console.error('获取商品详情失败', err)
        this.error = '网络异常，请稍后重试'
      } finally {
        this.loading = false
      }
    },

    /**
     * 检查商品收藏状态
     * 需要登录验证
     */
    async checkFavoriteStatus() {
      if (!this.productId) return

      // 读取 token（兼容不同存储 key，优先使用 member_token）
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
      if (!token) {
        // 未登录时默认为未收藏
        this.isFavorited = false
        return
      }

      try {
        const response = await uni.request({
          url: `${BASE_URL}/api/favorite/check/${this.productId}`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          this.isFavorited = response.data.data || false
        } else {
          // 出错时默认为未收藏
          this.isFavorited = false
        }
      } catch (err) {
        console.error('检查收藏状态失败', err)
        this.isFavorited = false
      }
    },

    /**
     * 添加商品到购物车
     * 需要登录（从本地存储读取 token，会在请求头中传递 Authorization: Bearer <token>）
     */
    async addToCart() {
      if (!this.productId) {
        uni.showToast({ title: '商品 ID 无效', icon: 'none' })
        return
      }

      // 读取 token（兼容不同存储 key，优先使用 member_token）
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        // 可根据项目路由跳转到登录页
        // uni.navigateTo({ url: '/pages/member/login' })
        return
      }

      try {
        uni.showLoading({ title: '正在添加...' })
        const postData = {
          productId: Number(this.productId),
          quantity: Number(this.quantity) || 1
        }

        const response = await uni.request({
          url: `${BASE_URL}/api/order/cart/add`,
          method: 'POST',
          data: postData,
          header: {
            // 明确传 Authorization，后端从 token 中获取 memberId
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          uni.showToast({ title: '已加入购物车', icon: 'success' })
        } else {
          const msg = (response.data && response.data.message) || '加入购物车失败'
          uni.showToast({ title: msg, icon: 'none' })
        }
      } catch (err) {
        console.error('添加购物车失败', err)
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },

    /**
     * 切换收藏状态
     * 根据当前状态调用收藏或取消收藏API
     */
    async toggleFavorite() {
      if (!this.productId) {
        uni.showToast({ title: '商品 ID 无效', icon: 'none' })
        return
      }

      // 读取 token（兼容不同存储 key，优先使用 member_token）
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      if (this.favoriteLoading) return // 防止重复点击

      try {
        this.favoriteLoading = true

        if (this.isFavorited) {
          // 取消收藏
          await this.removeFavorite()
        } else {
          // 添加收藏
          await this.addFavorite()
        }
      } catch (err) {
        console.error('切换收藏状态失败', err)
        uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
      } finally {
        this.favoriteLoading = false
      }
    },

    /**
     * 添加收藏
     */
    async addFavorite() {
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''

      try {
        const response = await uni.request({
          url: `${BASE_URL}/api/favorite/add`,
          method: 'POST',
          data: {
            productId: Number(this.productId)
          },
          header: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          this.isFavorited = true
          uni.showToast({ title: '收藏成功', icon: 'success' })
        } else {
          const msg = (response.data && response.data.message) || '收藏失败'
          uni.showToast({ title: msg, icon: 'none' })
        }
      } catch (err) {
        console.error('添加收藏失败', err)
        throw err
      }
    },

    /**
     * 取消收藏
     */
    async removeFavorite() {
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''

      try {
        const response = await uni.request({
          url: `${BASE_URL}/api/favorite/remove/${this.productId}`,
          method: 'DELETE',
          header: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          this.isFavorited = false
          uni.showToast({ title: '取消收藏成功', icon: 'success' })
        } else {
          const msg = (response.data && response.data.message) || '取消收藏失败'
          uni.showToast({ title: msg, icon: 'none' })
        }
      } catch (err) {
        console.error('取消收藏失败', err)
        throw err
      }
    },

    // 购买数量自增/自减
    increaseQuantity() {
      this.quantity = Number(this.quantity) + 1
    },
    decreaseQuantity() {
      if (this.quantity > 1) this.quantity = Number(this.quantity) - 1
    }
  }
}
</script>

<style scoped>
.loading, .error {
  padding: 20px;
  text-align: center;
  color: #666;
}
.product-image {
  width: 100%;
  height: 220px;
  background: #f6f6f6;
}
.info {
  padding: 12px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.title {
  font-size: 18px;
  color: #333;
  font-weight: 600;
  flex: 1;
  margin-right: 12px;
}
.favorite-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid #e6e6e6;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}
.favorite-btn:active {
  background: #f5f5f5;
}
.favorite-btn.favorited {
  border-color: #ff4757;
  background: #fff5f5;
}
.favorite-btn.favorited .icon {
  color: #ff4757;
}
.favorite-btn.favorited .text {
  color: #ff4757;
}
.icon {
  font-size: 16px;
  margin-right: 4px;
}
.text {
  font-size: 14px;
  color: #666;
}
.category, .price, .stock {
  display: block;
  margin-bottom: 6px;
  color: #666;
}
.price {
  color: #d2691e;
  font-size: 18px;
  font-weight: 700;
}
.desc {
  margin-top: 10px;
  color: #444;
  line-height: 1.6;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-top: 1px solid #eee;
}
.qty-control {
  display: flex;
  align-items: center;
  margin-right: 12px;
}
.qty-btn {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  color: #333;
}
.qty-value {
  padding: 0 8px;
  min-width: 28px;
  text-align: center;
}
.add-cart-btn {
  flex: 1;
  background: #d2691e;
  color: #fff;
  padding: 10px;
  text-align: center;
  border-radius: 6px;
  font-weight: 600;
}
</style>


