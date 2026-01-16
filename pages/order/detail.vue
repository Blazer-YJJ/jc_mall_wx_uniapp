<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-15 11:00:00
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-16 03:58:50
 * @FilePath: \jc_mall_wx_uni\pages\order\detail.vue
 * @Description: 订单详情页 - 展示单个订单明细
--> 
<template>
  <view class="order-detail-page">
    <scroll-view v-if="order" class="detail-scroll" scroll-y>
      <view class="order-header" v-if="order">
        <view class="header-left">
          <text class="order-id">订单号：{{ order.order_id }}</text>
          <text class="order-time">{{ formatTime(order.create_time) }}</text>
          <text class="order-type" style="color:#666;font-size:13px;margin-top:6px;">
            取货方式：{{ order.orderType === 1 ? '配送' : '自取' }}
          </text>
        </view>
        <view class="header-right">
          <text class="status">{{ order.statusText }}</text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">商品</text>
        <view class="goods-list">
          <view class="goods-item" v-for="item in order.items" :key="item.product_id">
            <view class="goods-left">
              <image v-if="item.image" :src="item.image" class="g-img" mode="aspectFill" />
              <view class="g-meta">
                <text class="g-name">{{ item.product_name }}</text>
                <text class="g-price">¥{{ Number(item.price).toFixed(2) }}</text>
                <text class="g-qty">x{{ item.quantity }}</text>
              </view>
            </view>
            <text class="g-sub">¥{{ Number(item.subtotal).toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="section-title">配送信息</text>
        <view class="info-row">
          <text class="info-label">地址：</text>
          <text class="info-text">{{ order.delivery_address || '无' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">配送时间：</text>
          <text class="info-text">{{ order.delivery_time ? formatTime(order.delivery_time) : '无' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">备注：</text>
          <text class="info-text">{{ order.remark || '无' }}</text>
        </view>
      </view>

      <view class="card total-card">
        <view class="total-left">
          <text class="total-label">合计：</text>
        </view>
        <view class="total-right">
          <text class="total-amount">¥{{ order.total_amount }}</text>
        </view>
      </view>
      <!-- 操作按钮：取消 / 继续提交 -->
      <view class="action-bar" v-if="order">
        <view class="action-btn cancel" @click="confirmChangeStatus(0)" :disabled="changingStatus">取消订单</view>
        <view class="action-btn continue" @click="confirmChangeStatus(1)" :disabled="changingStatus">继续提交</view>
      </view>
    </scroll-view>

    <view v-else class="empty">正在加载订单详情...</view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'
export default {
  name: 'OrderDetail',
  data() {
    return {
      order: null,
      loading: false
      ,changingStatus: false
    }
  },
  onLoad(options) {
    const orderId = options.orderId || options.order_id
    if (orderId) {
      this.fetchDetail(orderId)
    } else {
      uni.showToast({ title: '订单ID缺失', icon: 'none' })
    }
  },
  methods: {
    // 将图片地址规范为绝对地址：若已包含协议则原样返回，否则补充 BASE_URL
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    fetchDetail(orderId) {
      if (this.loading) return
      this.loading = true
      const token = uni.getStorageSync('member_token') || ''
      const url = `${BASE_URL}/api/order/member/orders/${orderId}`
      uni.request({
        url,
        method: 'GET',
        header: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            // 规范化后端返回的数据，兼容字段命名差异并拼接图片地址
            const od = Object.assign({}, resp.data)
            // 统一合计字段命名
            od.total_amount = od.total_amount || od.totalAmount || od.totalAmount
            // 规范化 items 数组，确保 image 为绝对地址，且有 product_name 字段
            if (Array.isArray(od.items)) {
              od.items = od.items.map((it) => {
                const image = it.image || it.img || it.picture || it.pic || ''
                const productName = it.product_name || it.productName || it.name || ''
                const price = (it.price !== undefined && it.price !== null) ? it.price : (it.unit_price || 0)
                const quantity = it.quantity || it.qty || 0
                const subtotal = (it.subtotal !== undefined && it.subtotal !== null) ? it.subtotal : (price * quantity)
                return Object.assign({}, it, {
                  image: this.getImageUrl(image),
                  product_name: productName,
                  price,
                  quantity,
                  subtotal
                })
              })
            } else {
              od.items = []
            }
            this.order = od
          } else {
            uni.showToast({ title: resp && resp.message ? resp.message : '获取失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('订单详情请求失败', err)
          uni.showToast({ title: '网络错误', icon: 'none' })
        },
        complete: () => {
          this.loading = false
        }
      })
    },

    // 显示确认弹窗后执行状态修改
    confirmChangeStatus(status) {
      const title = status === 0 ? '取消订单' : '继续提交'
      const content = status === 0 ? '确认要取消该订单吗？' : '确认要继续提交该订单吗？'
      uni.showModal({
        title,
        content,
        success: (res) => {
          if (res.confirm) {
            this.changeOrderStatus(status)
          }
        }
      })
    },
    // 修改订单状态：0 取消，1 继续提交
    changeOrderStatus(status) {
      if (!this.order) return
      if (this.changingStatus) return
      this.changingStatus = true
      // 后端要求使用订单业务 ID（order_id）作为 path 参数，优先使用 order_id
      const orderId = this.order.order_id || this.order.orderId || this.order.id
      if (!orderId) {
        uni.showToast({ title: '订单ID缺失，无法修改', icon: 'none' })
        this.changingStatus = false
        return
      }
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || ''
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        this.changingStatus = false
        return
      }
      const url = `${BASE_URL}/api/order/member/orders/${encodeURIComponent(orderId)}/status`
      uni.request({
        url,
        method: 'PUT',
        data: { status },
        header: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            uni.showToast({ title: resp.message || '订单状态修改成功', icon: 'success' })
            // 使用后端返回的新状态更新页面展示
            const payload = resp.data
            if (payload.newStatus !== undefined) this.order.status = payload.newStatus
            if (payload.statusText) this.order.statusText = payload.statusText
          } else {
            uni.showToast({ title: (resp && resp.message) || '修改失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('修改订单状态失败', err)
          uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        },
        complete: () => {
          this.changingStatus = false
        }
      })
    },

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
.order-detail-page {
  min-height: 100vh;
  background: #FFF8DC;
}
.detail-scroll {
  padding: 12px;
  box-sizing: border-box;
  height: calc(100vh - 0px);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.header-left {
  display: flex;
  flex-direction: column;
}
.order-id {
  color: #666;
  font-size: 13px;
  margin-bottom: 6px;
  max-width: 100%;
  /* 允许多行显示订单号，长订单号自动换行展示 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.4;
}
.order-time {
  color: #999;
  font-size: 12px;
}
.header-right .status {
  color: #d2691e;
  font-weight: 700;
  font-size: 13px;
}
.card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f3e9df;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.section-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.goods-list { display:block; }
.goods-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.goods-item:last-child { border-bottom: none; }
.goods-left { display:flex; align-items:center; gap:8px; }
.g-name {
  color: #333;
  font-size: 14px;
  max-width: 100%;
  /* 支持最多两行显示商品名称，超出用省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.3;
}
.g-qty { color:#999; font-size:13px; margin-left:6px; }
.g-sub { color:#666; font-size:14px; }
.g-img { width:64px; height:64px; border-radius:6px; background:#f3f3f3; margin-right:8px; }
.g-meta { display:flex; flex-direction:column; }
.g-price { color:#999; font-size:13px; margin-top:6px; }
.info-row { display:flex; padding:6px 0; align-items:flex-start; }
.info-label { width:64px; color:#999; font-size:13px; }
.info-text { color:#666; font-size:13px; flex:1; line-height:18px; word-break:break-word; }
.total-card { display:flex; justify-content:space-between; align-items:center; padding:14px; }
.total-label { color:#666; font-size:14px; }
.total-amount { color:#333; font-size:18px; font-weight:700; }
.empty { text-align:center; color:#999; padding:24px; }
.action-bar {
  display:flex;
  gap:12px;
  padding: 12px;
  box-sizing: border-box;
}
.action-btn {
  flex:1;
  text-align:center;
  padding:12px;
  border-radius:6px;
  font-weight:700;
}
.action-btn.cancel {
  background:#f5f5f5;
  color:#666;
}
.action-btn.continue {
  background:#d2691e;
  color:#fff;
}
</style>


