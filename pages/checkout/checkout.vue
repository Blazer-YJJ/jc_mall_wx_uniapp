<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-13 16:00:57
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-16 01:41:38
 * @FilePath: \jc_mall_wx_uni\pages\checkout\checkout.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <view class="checkout-page">
    <view class="header">
      <text class="title">购物车</text>
    </view>

    <scroll-view class="cart-list" scroll-y>
      <!-- 全选复选框 -->
      <view class="select-all-row" v-if="cartList.length">
        <view class="checkbox" @click="toggleSelectAll">
          <view class="box" :class="{ checked: selectAll }"></view>
        </view>
        <text class="select-all-text" @click="toggleSelectAll">全选</text>
      </view>
      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="cartList.length === 0" class="empty">购物车为空</view>

      <view class="cart-item" v-for="item in cartList" :key="item.id">
        <view class="checkbox" @click.stop="toggleSelectItem(item.id)">
          <view class="box" :class="{ checked: isSelected(item.id) }"></view>
        </view>
        <image class="item-image" :src="getImageUrlFromItem(item)" mode="aspectFill" />
        <view class="item-body">
          <text class="item-name">{{ item.productName }}</text>
          <text class="item-stock">库存：{{ item.stock }}</text>
          <view class="item-meta">
            <view class="qty-edit">
              <view class="qty-btn" @click="changeQuantity(item, -1)">-</view>
              <text class="qty-value">{{ item.quantity }}</text>
              <view class="qty-btn" @click="changeQuantity(item, 1)">+</view>
            </view>
            <text class="item-sub">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
          </view>
        </view>
        <view class="item-actions">
          <text class="delete" @click="removeItem(item.id)">删除</text>
        </view>
      </view>
    </scroll-view>

    <!-- 取货方式弹窗 -->
    <view v-if="showOrderModule" class="modal-overlay" @click.self="closeOrderModule">
      <view class="modal-wrapper" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择取货方式</text>
        </view>
        <view class="modal-content">
          <view class="modal-item" @click="selectOrderType(0)">
            <image v-if="pickupImage" :src="pickupImage" class="modal-img" mode="aspectFill" />
            <view v-else class="modal-img placeholder"></view>
            <text class="modal-label">自取</text>
          </view>
          <view class="modal-item" @click="selectOrderType(1)">
            <image v-if="deliveryImage" :src="deliveryImage" class="modal-img" mode="aspectFill" />
            <view v-else class="modal-img placeholder"></view>
            <text class="modal-label">配送</text>
          </view>
        </view>

        <!-- 订单备注 -->
        <view class="form-group">
          <text class="form-label">订单备注</text>
          <textarea
            v-model="orderForm.remark"
            class="form-textarea"
            placeholder="请输入订单备注（选填）"
            maxlength="200"
          ></textarea>
        </view>

        <!-- 配送信息（仅在选择配送时显示） -->
        <view v-if="orderForm.orderType === 1" class="delivery-form">
        <view class="form-group">
            <text class="form-label required">配送地址</text>
            <!-- 使用 textarea 显示完整地址，方便换行与长文本 -->
            <textarea
              v-model="orderForm.deliveryAddress"
              class="form-textarea"
              placeholder="请输入配送地址（详细地址，建议写门牌号）"
            ></textarea>
          </view>
          <view class="form-group">
            <text class="form-label required">联系电话</text>
            <!-- 使用 tel 避免各平台 number 样式问题，显示与输入更稳定 -->
            <input
              v-model="orderForm.deliveryPhone"
              class="form-input"
              type="tel"
              placeholder="请输入联系电话"
            />
          </view>
          <view class="form-group">
            <text class="form-label">配送时间</text>
            <!-- 使用两个 picker 分别选择日期和时间，前端拼接为合法 DATETIME（YYYY-MM-DD HH:mm:ss） -->
            <view style="display:flex; gap:8px;">
              <picker mode="date" @change="onDeliveryDateChange">
                <view class="form-input picker-input" style="flex:1;">
                  {{ orderForm.deliveryDate || '选择配送日期' }}
                </view>
              </picker>
              <picker mode="time" @change="onDeliveryTimeChange">
                <view class="form-input picker-input" style="flex:1;">
                  {{ orderForm.deliveryTime || '选择配送时间' }}
                </view>
              </picker>
            </view>
            <text class="form-hint" style="display:block;margin-top:8px;color:#999;font-size:12px;">
              时间将以完整 DATETIME（YYYY-MM-DD HH:mm:ss）形式提交
            </text>
          </view>
        </view>

        <view class="modal-actions">
          <view class="modal-btn cancel" @click="closeOrderModule">取消</view>
          <view class="modal-btn confirm" @click="submitOrder" :class="{ disabled: submittingOrder }">
            {{ submittingOrder ? '提交中...' : '确认下单' }}
          </view>
        </view>
      </view>
    </view>

    <view class="footer">
      <view class="total">
        <text>合计：</text>
        <text class="amount">¥{{ selectedTotalAmount.toFixed(2) }}</text>
      </view>
      <view class="checkout-btn" @click="proceedCheckout" :class="{ disabled: cartList.length === 0 }">去结算</view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'
export default {
  name: 'Checkout',
  components: {
    OrderModule: () => import('@/components/home/OrderModule.vue')
  },
  data() {
    return {
      cartList: [],
      totalAmount: 0,
      // 选中项 id 列表，与全选控制
      selectedItems: [],
      selectAll: false,
      // 控制取货方式弹窗显示
      showOrderModule: false,
      // 弹窗所需图片（由 checkout 拉取并传入子组件）
      pickupImage: '',
      deliveryImage: '',
      loading: false,
      removing: false,
      // 订单表单数据
      orderForm: {
        orderType: 0, // 0:自提，1:配送
        remark: '', // 订单备注
        deliveryAddress: '', // 配送地址
        deliveryPhone: '', // 配送联系电话
        deliveryDate: '', // 配送日期 YYYY-MM-DD
        deliveryTime: '' // 配送时间 HH:mm
      },
      submittingOrder: false // 下单提交状态
    }
  },
  computed: {
    // 计算已选中商品合计金额
    selectedTotalAmount() {
      return this.cartList.reduce((sum, it) => {
        if (this.selectedItems.indexOf(it.id) !== -1) {
          const price = Number(it.price || 0)
          const qty = Number(it.quantity || 0)
          return sum + price * qty
        }
        return sum
      }, 0)
    }
  },
  onLoad() {
    this.fetchCart()
  },
  onShow() {
    // 每次页面显示时重新拉取购物车数据，保证数据是最新的
    this.fetchCart()
  },
  methods: {
    getImageUrl(url) {
      if (!url) return '/static/default-product.png'
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },

    // 获取购物车列表，接口需要 token
    fetchCart() {
      if (this.loading) return
      this.loading = true
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || ''
      const url = `${BASE_URL}/api/order/cart/list`
      uni.request({
        url,
        method: 'GET',
        header: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            this.cartList = resp.data.list || []
            this.totalAmount = resp.data.totalAmount || 0
            // 重置选中状态（每次刷新清空选择）
            this.selectedItems = []
            this.selectAll = false
          } else {
            uni.showToast({ title: (resp && resp.message) || '获取购物车失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('获取购物车失败', err)
          uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        },
        complete: () => {
          this.loading = false
        }
      })
    },

    // 删除购物车项
    removeItem(itemId) {
      if (!itemId) return
      if (this.removing) return
      uni.showModal({
        title: '确认',
        content: '确定要删除该商品吗？',
        success: (res) => {
          if (!res.confirm) return
          this.removing = true
          const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || ''
          const url = `${BASE_URL}/api/order/cart/remove/${itemId}`
          uni.request({
            url,
            method: 'DELETE',
            header: {
              Authorization: token ? `Bearer ${token}` : ''
            },
            success: (res) => {
              const resp = res.data
              if (resp && resp.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' })
                // 刷新列表
                this.fetchCart()
              } else {
                uni.showToast({ title: (resp && resp.message) || '删除失败', icon: 'none' })
              }
            },
            fail: (err) => {
              console.error('删除购物车项失败', err)
              uni.showToast({ title: '网络错误，请重试', icon: 'none' })
            },
            complete: () => {
              this.removing = false
            }
          })
        }
      })
    },

    // 判断某项是否被选中
    isSelected(id) {
      return this.selectedItems.indexOf(id) !== -1
    },

    // 切换单项选中
    toggleSelectItem(id) {
      const idx = this.selectedItems.indexOf(id)
      if (idx === -1) {
        this.selectedItems.push(id)
      } else {
        this.selectedItems.splice(idx, 1)
      }
      this.selectAll = this.selectedItems.length === this.cartList.length
    },

    // 全选 / 取消全选
    toggleSelectAll() {
      this.selectAll = !this.selectAll
      if (this.selectAll) {
        this.selectedItems = this.cartList.map(i => i.id)
      } else {
        this.selectedItems = []
      }
    },

    // 兼容 cart item 的 images 字段：支持字符串或数组
    getImageUrlFromItem(item) {
      if (!item) return this.getImageUrl(null)
      const imgs = item.images
      if (!imgs) return this.getImageUrl(null)
      if (Array.isArray(imgs)) {
        return this.getImageUrl(imgs[0])
      }
      // 如果是字符串，直接作为图片地址
      if (typeof imgs === 'string') {
        return this.getImageUrl(imgs)
      }
      // 否则回退
      return this.getImageUrl(null)
    },

    // 占位：去结算
    proceedCheckout() {
      if (this.cartList.length === 0) {
        uni.showToast({ title: '购物车为空', icon: 'none' })
        return
      }
      if (this.selectedItems.length === 0) {          
        uni.showToast({ title: '请先选择商品', icon: 'none' })
        return
      }
      // 先拉取图片再显示弹窗
      this.fetchHomeImages().then(() => {
        this.showOrderModule = true
      }).catch(() => {
        // 即便拉取失败，也打开弹窗（组件会显示占位）
        this.showOrderModule = true
      })
    }
    ,

    // 修改数量（本地更新并尝试同步到后端 /api/order/cart/update）
    changeQuantity(item, delta) {
      if (!item) return
      const newQty = Number(item.quantity) + delta
      if (newQty < 1) return
      // 仅在本地更新数量与小计，不发送网络请求
      item.quantity = newQty
      if (typeof item.price === 'number' || typeof item.price === 'string') {
        const price = Number(item.price)
        item.subtotal = (price * item.quantity).toFixed(2)
      }
      // 更新完本地数据后，触发视图刷新（已自动响应）
      uni.showToast({ title: '数量已更新', icon: 'success' })
    },
    // 从后端获取首页的取货/配送图片（公开接口）
    fetchHomeImages() {
      return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/home/images`
        uni.request({
          url,
          method: 'GET',
          success: (res) => {
            const resp = res.data
            if (resp && resp.code === 200 && resp.data) {
              const data = resp.data
              const payload = data.data || data
              this.pickupImage = payload.pickupImage ? this.getImageUrl(payload.pickupImage) : ''
              this.deliveryImage = payload.deliveryImage ? this.getImageUrl(payload.deliveryImage) : ''
              resolve()
            } else {
              console.warn('获取首页图片失败', resp && resp.message)
              reject()
            }
          },
          fail: (err) => {
            console.warn('请求首页图片失败', err)
            reject(err)
          }
        })
      })
    },
    // 关闭 OrderModule 弹窗
    closeOrderModule() {
      this.showOrderModule = false
      // 重置表单数据
      this.resetOrderForm()
    },

    // 选择订单类型（0:自提，1:配送）
    selectOrderType(orderType) {
      this.orderForm.orderType = orderType
    },

    // 重置订单表单
    resetOrderForm() {
      this.orderForm = {
        orderType: 0,
        remark: '',
        deliveryAddress: '',
        deliveryPhone: '',
        deliveryDate: '',
        deliveryTime: ''
      }
    },

    // 表单验证
    validateOrderForm() {
      const { orderType, deliveryAddress, deliveryPhone, deliveryDate, deliveryTime } = this.orderForm

      if (orderType === 1) { // 配送订单
        if (!deliveryAddress.trim()) {
          uni.showToast({ title: '请输入配送地址', icon: 'none' })
          return false
        }
        if (!deliveryPhone.trim()) {
          uni.showToast({ title: '请输入联系电话', icon: 'none' })
          return false
        }
        // 简单验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/
        if (!phoneRegex.test(deliveryPhone)) {
          uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
          return false
        }
        // 校验配送时间：如果用户选择了日期或时间，必须同时选择两者并且能组成合法 DATETIME
        if ((deliveryDate && !deliveryTime) || (!deliveryDate && deliveryTime)) {
          uni.showToast({ title: '请选择完整的配送日期和时间或留空', icon: 'none' })
          return false
        }
        if (deliveryDate && deliveryTime) {
          // 使用 ISO 格式构建并验证
          const iso = `${deliveryDate}T${deliveryTime}:00`
          const dt = new Date(iso)
          if (isNaN(dt.getTime())) {
            uni.showToast({ title: '请选择有效的配送时间', icon: 'none' })
            return false
          }
        }
      }

      return true
    },

    // 提交订单
    submitOrder() {
      if (this.submittingOrder) return

      // 验证表单
      if (!this.validateOrderForm()) {
        return
      }

      // 获取选中的购物车商品
      const selectedCartItems = this.cartList.filter(item =>
        this.selectedItems.includes(item.id)
      )

      if (selectedCartItems.length === 0) {
        uni.showToast({ title: '请选择要购买的商品', icon: 'none' })
        return
      }

      this.submittingOrder = true

      // 构建请求参数
      const orderData = {
        cartItems: selectedCartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        // 兼容后端：明确传入被下单的购物车项 id 列表，避免后端误将整个购物车清空
        cartItemIds: selectedCartItems.map(item => item.id),
        remark: this.orderForm.remark.trim(),
        orderType: this.orderForm.orderType
      }

      // 配送相关参数
      if (this.orderForm.orderType === 1) {
        orderData.deliveryAddress = this.orderForm.deliveryAddress.trim()
        orderData.deliveryPhone = this.orderForm.deliveryPhone.trim()
        // 如果同时选择了日期和时间，拼接为 DATETIME（YYYY-MM-DD HH:mm:00）
        const datePart = (this.orderForm.deliveryDate || '').trim()
        const timePart = (this.orderForm.deliveryTime || '').trim()
        if (datePart && timePart) {
          orderData.deliveryTime = `${datePart} ${timePart}:00`
        }
      }

      // 获取token
      const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || ''
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        this.submittingOrder = false
        return
      }

      const url = `${BASE_URL}/api/order/create`
      uni.request({
        url,
        method: 'POST',
        data: orderData,
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            uni.showToast({ title: '订单创建成功', icon: 'success' })
            // 关闭弹窗
            this.closeOrderModule()
            // 仅移除已下单的购物车项（本地立即更新，避免后端误清空导致全部消失）
            try {
              const removedIds = orderData.cartItemIds || (orderData.cartItems || []).map(ci => ci.id)
              if (Array.isArray(removedIds) && removedIds.length > 0) {
                this.cartList = this.cartList.filter(ci => !removedIds.includes(ci.id))
              }
            } catch (e) {
              // 忽略本地更新错误，后续会拉取服务端数据
              console.warn('本地移除已下单项失败', e)
            }
            // 清空选中状态
            this.selectedItems = []
            this.selectAll = false
            // 同步服务端数据（用于校验后端实际删除结果），较晚调用以保证 UX 流畅
            setTimeout(() => {
              this.fetchCart()
            }, 700)
            // 下单成功后跳转到订单列表页（不跳转到详情页）
            setTimeout(() => {
              uni.navigateTo({
                url: `/pages/order/order`
              })
            }, 800)
          } else {
            uni.showToast({
              title: (resp && resp.message) || '订单创建失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          console.error('创建订单失败', err)
          uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        },
        complete: () => {
          this.submittingOrder = false
        }
      })
    },
    // 处理配送时间选择器的变更
    onDeliveryTimeChange(e) {
      // picker 的 value 在 e.detail.value（格式为 "HH:mm"）
      if (e && e.detail) {
        this.orderForm.deliveryTime = e.detail.value || ''
      }
    },
    // 处理配送日期选择器变更（格式 YYYY-MM-DD）
    onDeliveryDateChange(e) {
      if (e && e.detail) {
        this.orderForm.deliveryDate = e.detail.value || ''
      }
    },
  }
}
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #FFF8DC;
  padding-bottom: 80px; /* 保留底部空间 */
}
.header { padding: 12px 16px; }
.title { font-weight: 700; color: #333; font-size: 18px; }
.cart-list { padding: 0 12px 16px; height: calc(100vh - 160px); box-sizing: border-box; }
.cart-item {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  margin: 12px 0;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.item-image { width: 72px; height: 72px; border-radius: 6px; margin-right: 12px; background:#f6f6f6; }
.item-body { flex: 1; }
.item-name { font-size: 14px; color:#333; margin-bottom:6px; display:block; max-width: 100%; }
.item-stock { font-size:12px; color:#999; margin-bottom:6px; }
.item-meta { display:flex; justify-content:space-between; align-items:center; }
.item-qty { color:#666; font-size:13px; }
.item-sub { color:#333; font-weight:700; }
.item-actions { width:56px; text-align:center; }
.delete { color:#d2691e; font-size:13px; }
.select-all-row { display:flex; align-items:center; padding:8px 12px; }
.checkbox { width:28px; display:flex; align-items:center; justify-content:center; margin-right:8px; cursor:pointer; }
.box { width:18px; height:18px; border:1px solid #ddd; border-radius:3px; background:#fff; display:inline-block; position:relative; }
.box.checked { background:#d2691e; border-color:#d2691e; }
.box.checked::after { content: '✓'; color:#fff; font-size:12px; position:absolute; left:0; right:0; top:0; bottom:0; display:flex; align-items:center; justify-content:center; }
.select-all-text { color:#666; font-size:14px; }
.qty-edit { display:flex; align-items:center; gap:8px; }
.qty-btn { width:26px; height:26px; line-height:26px; text-align:center; border:1px solid #e6e6e6; border-radius:4px; color:#333; background:#fff; display:inline-flex; align-items:center; justify-content:center; }
.qty-value { min-width:28px; text-align:center; display:inline-block; }
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #eee;
}
.total { display:flex; align-items:center; gap:8px; }
.amount { color:#d2691e; font-weight:700; font-size:18px; }
.checkout-btn {
  background:#d2691e;
  color:#fff;
  padding:10px 18px;
  border-radius:6px;
  font-weight:700;
}
.checkout-btn.disabled { background:#ccc; }
.empty { text-align:center; padding:28px; color:#999; }
/* 弹窗遮罩与容器样式 */
.modal-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-wrapper {
  width: 92%;
  max-width: 720px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-sizing: border-box;
  max-height: 90vh;
  overflow: auto;
}
.modal-header {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}
.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}
.modal-btn.confirm {
  background: #d2691e;
  color: #fff;
}
.modal-btn.disabled {
  background: #ccc !important;
  color: #999 !important;
}
.form-group {
  margin-top: 16px;
}
.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}
.form-label.required::after {
  content: '*';
  color: #ff4444;
  margin-left: 4px;
}
.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  /* 明确高度与行高，避免不同平台 input 被压缩显示不全 */
  height: 44px;
  line-height: 20px;
}
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  /* 提高最小高度，保证地址多行显示 */
  min-height: 96px;
  box-sizing: border-box;
  resize: none;
  line-height: 20px;
}
.picker-input {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  color: #666;
  cursor: pointer;
}
.delivery-form {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}
.modal-content {
  display: flex;
  gap: 12px;
}
.modal-item {
  width: 48%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-img {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  background: #f3f3f3;
}
.modal-img.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.modal-label {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}
</style>
