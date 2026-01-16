<template>
  <view class="favorites-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">我的收藏</text>
      <view class="refresh-btn" @click="refreshData">
        <text class="refresh-icon">🔄</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>正在加载...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button class="retry-btn" @click="refreshData">重试</button>
    </view>

    <!-- 空状态 -->
    <view v-else-if="favorites.length === 0" class="empty">
      <view class="empty-icon">💖</view>
      <text class="empty-text">暂无收藏商品</text>
      <text class="empty-desc">快去发现心仪的商品吧！</text>
    </view>

    <!-- 收藏商品列表 -->
    <view v-else class="favorites-list">
      <view
        v-for="item in favorites"
        :key="item.id"
        class="product-card"
        @click="goToProduct(item.productId)"
      >
        <!-- 商品图片 -->
        <view class="product-image">
          <image
            :src="getImageUrl(item.image)"
            mode="aspectFill"
            class="image"
            @error="onImageError"
          />
        </view>

        <!-- 商品信息 -->
        <view class="product-info">
          <text class="product-name">{{ item.productName }}</text>
          <text class="product-price">¥{{ item.price }}</text>
          <text class="product-date">{{ formatDate(item.createdAt) }}</text>
        </view>

        <!-- 取消收藏按钮 -->
        <view
          class="remove-btn"
          @click.stop="removeFavorite(item.productId)"
          :class="{ 'removing': removingIds.has(item.productId) }"
        >
          <text class="remove-text">{{ removingIds.has(item.productId) ? '取消中' : '取消收藏' }}</text>
        </view>
      </view>
    </view>

    <!-- 分页信息 -->
    <view v-if="!loading && favorites.length > 0" class="pagination">
      <text class="pagination-text">
        第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共 {{ pagination.total }} 个收藏
      </text>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'Favorites',
  data() {
    return {
      // 收藏列表数据
      favorites: [],
      // 分页信息
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      },
      // 加载状态
      loading: true,
      // 错误信息
      error: null,
      // 取消收藏加载状态
      removingIds: new Set()
    }
  },
  onLoad() {
    this.fetchFavorites()
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
      // 确保拼接时不会出现双斜杠
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },

    /**
     * 获取收藏列表
     * 对接 /api/favorite/list 接口
     */
    async fetchFavorites(page = 1) {
      try {
        this.loading = true
        this.error = null

        // 获取认证 token
        const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
        if (!token) {
          this.error = '请先登录'
          this.loading = false
          return
        }

        const response = await uni.request({
          url: `${BASE_URL}/api/favorite/list`,
          method: 'GET',
          data: {
            page: page,
            limit: this.pagination.limit
          },
          header: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const data = response.data.data || {}
          // 规范化收藏商品图片地址
          this.favorites = (data.list || []).map((item) =>
            Object.assign({}, item, { image: this.getImageUrl(item.image) })
          )
          this.pagination = data.pagination || this.pagination
        } else {
          const msg = (response.data && response.data.message) || '获取收藏列表失败'
          this.error = msg
          uni.showToast({ title: msg, icon: 'none' })
        }
      } catch (err) {
        console.error('获取收藏列表失败', err)
        this.error = '网络异常，请稍后重试'
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    /**
     * 取消收藏
     * 对接 /api/favorite/remove/:productId 接口
     */
    async removeFavorite(productId) {
      if (!productId) {
        uni.showToast({ title: '商品ID无效', icon: 'none' })
        return
      }

      // 获取认证 token
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      // 防止重复操作
      if (this.removingIds.has(productId)) return

      try {
        this.removingIds.add(productId)

        uni.showLoading({ title: '正在取消...' })

        const response = await uni.request({
          url: `${BASE_URL}/api/favorite/remove/${productId}`,
          method: 'DELETE',
          header: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          // 从列表中移除该商品
          this.favorites = this.favorites.filter(item => item.productId !== productId)
          // 更新总数
          this.pagination.total = Math.max(0, this.pagination.total - 1)
          // 重新计算总页数
          this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.limit)

          uni.showToast({ title: '取消收藏成功', icon: 'success' })

          // 如果当前页没有数据了，且不是第一页，则加载上一页
          if (this.favorites.length === 0 && this.pagination.page > 1) {
            this.pagination.page -= 1
            this.fetchFavorites(this.pagination.page)
          }
        } else {
          const msg = (response.data && response.data.message) || '取消收藏失败'
          uni.showToast({ title: msg, icon: 'none' })
        }
      } catch (err) {
        console.error('取消收藏失败', err)
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
      } finally {
        this.removingIds.delete(productId)
        uni.hideLoading()
      }
    },

    /**
     * 跳转到商品详情页
     */
    goToProduct(productId) {
      uni.navigateTo({
        url: `/pages/product/product?productId=${productId}`
      })
    },

    /**
     * 重新加载数据
     */
    refreshData() {
      this.fetchFavorites(1)
    },

    /**
     * 格式化日期显示
     */
    formatDate(dateString) {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) {
          return '今天收藏'
        } else if (days === 1) {
          return '昨天收藏'
        } else if (days < 7) {
          return `${days}天前收藏`
        } else {
          return date.toLocaleDateString('zh-CN')
        }
      } catch (err) {
        return dateString
      }
    },

    /**
     * 处理图片加载失败
     */
    onImageError(e) {
      console.warn('图片加载失败', e)
    }
  }
}
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.refresh-btn {
  padding: 8px;
  border-radius: 50%;
  background: #f5f5f5;
  cursor: pointer;
}
.refresh-btn:active {
  background: #e9ecef;
}
.refresh-icon {
  font-size: 16px;
}

/* 加载状态 */
.loading {
  padding: 40px;
  text-align: center;
  color: #666;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
}

/* 错误状态 */
.error {
  padding: 40px 20px;
  text-align: center;
  color: #dc3545;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
}
.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

/* 空状态 */
.empty {
  padding: 60px 20px;
  text-align: center;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-text {
  font-size: 16px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}
.empty-desc {
  font-size: 14px;
  color: #999;
}

/* 商品卡片列表 */
.favorites-list {
  padding: 16px;
}

/* 商品卡片 */
.product-card {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}
.product-card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 商品图片 */
.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  background: #f8f9fa;
}
.image {
  width: 100%;
  height: 100%;
}

/* 商品信息 */
.product-info {
  flex: 1;
}
.product-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
  line-height: 1.4;
}
.product-price {
  font-size: 16px;
  color: #d2691e;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}
.product-date {
  font-size: 12px;
  color: #999;
}

/* 取消收藏按钮 */
.remove-btn {
  padding: 8px 12px;
  border: 1px solid #ff4757;
  border-radius: 20px;
  background: #fff;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}
.remove-btn:active {
  background: #fff5f5;
}
.remove-btn.removing {
  border-color: #ccc;
  background: #f8f9fa;
}
.remove-icon {
  font-size: 14px;
  margin-right: 4px;
}
.remove-text {
  font-size: 12px;
  color: #ff4757;
}
.remove-btn.removing .remove-text {
  color: #999;
}

/* 分页信息 */
.pagination {
  padding: 16px;
  text-align: center;
}
.pagination-text {
  font-size: 14px;
  color: #666;
}
</style>


