<template>
  <view class="order-page">
    <scroll-view class="order-list" scroll-y>
      <view v-if="loading && orders.length === 0" class="empty">加载中...</view>
      <view v-if="!loading && orders.length === 0" class="empty">暂无订单</view>

      <view class="order-card" v-for="order in orders" :key="order.id" @click="openDetail(order.order_id)">
        <view class="order-row">
          <text class="order-id">订单号：{{ order.order_id }}</text>
          <text class="order-status">{{ order.statusText }}</text>
        </view>
        <view class="order-row">
          <text class="order-items">{{ summarizeItems(order.items) }}</text>
        </view>
        <view class="order-row footer">
          <text class="order-time">{{ formatTime(order.create_time) }}</text>
          <text class="order-amount">¥{{ order.total_amount }}</text>
        </view>
      </view>

      <view class="list-footer" v-if="loadingMore">加载更多...</view>
    </scroll-view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'Order',
  data() {
    return {
      orders: [],
      page: 1,
      limit: 10,
      totalPages: 1,
      loading: false,
      loadingMore: false
    }
  },
  onLoad() {
    this.fetchOrders()
  },
  methods: {
    // 获取订单列表（需要 token）
    fetchOrders(isLoadMore = false) {
      if (isLoadMore) {
        if (this.page >= this.totalPages) return
        this.page += 1
        this.loadingMore = true
      } else {
        this.page = 1
        this.orders = []
        this.loading = true
      }

      const token = uni.getStorageSync('member_token') || ''
      const url = `${BASE_URL}/api/order/member/orders?page=${this.page}&limit=${this.limit}`
      uni.request({
        url,
        method: 'GET',
        header: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            const list = resp.data.list || []
            this.totalPages = (resp.data.pagination && resp.data.pagination.totalPages) || 1
            this.orders = isLoadMore ? this.orders.concat(list) : list
          } else {
            uni.showToast({ title: resp && resp.message ? resp.message : '订单获取失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('请求订单失败', err)
          uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        },
        complete: () => {
          this.loading = false
          this.loadingMore = false
        }
      })
    },

    // 打开订单详情页，需要 orderId
    openDetail(orderId) {
      if (!orderId) return
      uni.navigateTo({ url: `/pages/order/detail?orderId=${orderId}` })
    },

    // 简短描述商品列表
    summarizeItems(items) {
      if (!items || items.length === 0) return ''
      return items.map(i => i.product_name).slice(0, 3).join('，') + (items.length > 3 ? ' 等' : '')
    },

    // 时间格式化（简单）
    formatTime(time) {
      if (!time) return ''
      const d = new Date(time)
      const yy = d.getFullYear()
      const mm = (d.getMonth() + 1).toString().padStart(2, '0')
      const dd = d.getDate().toString().padStart(2, '0')
      const hh = d.getHours().toString().padStart(2, '0')
      const mi = d.getMinutes().toString().padStart(2, '0')
      return `${yy}-${mm}-${dd} ${hh}:${mi}`
    }
  }
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background: #FFF8DC; /* 与全局风格保持一致的米色背景 */
}
.order-header {
  padding: 18px 16px;
  text-align: center;
  background: transparent;
}
.title {
  font-weight: bold;
  color: #333;
  font-size: 18px;
}
.order-list {
  padding: 16px;
  height: calc(100vh - 84px);
  box-sizing: border-box;
}
.order-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid #f3e9df;
  box-shadow: 0 4px 10px rgba(0,0,0,0.04);
  box-sizing: border-box;
}
.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.order-id {
  color: #999;
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-status {
  color: #d2691e;
  font-weight: 600;
  font-size: 13px;
  margin-left: 8px;
  white-space: nowrap;
}
.order-items {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
  display: block;
  line-height: 18px;
  max-height: 36px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.footer {
  margin-top: 6px;
}
.order-time {
  color: #999;
  font-size: 12px;
}
.order-amount {
  color: #333;
  font-weight: 700;
  font-size: 15px;
}
.empty {
  text-align: center;
  padding: 24px;
  color: #999;
}
.list-footer {
  text-align: center;
  padding: 12px;
  color: #999;
}
</style>


