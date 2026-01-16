<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-15 03:44:10
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-16 05:14:23
 * @FilePath: \jc_mall_wx_uni\components\member\MyService.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-15 10:00:00
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-15 04:37:06
 * @FilePath: \jc_mall_wx_uni\components\member\MyService.vue
 * @Description: 我的服务模块
-->
<template>
  <view class="my-service">
    <!-- 我的服务标题 -->
    <view class="service-title">我的服务</view>

    <!-- 菜单网格：从接口加载图片后渲染 -->
    <view class="service-grid">
      <view
        class="service-item"
        v-for="(item, index) in menuList"
        :key="index"
        @click="onMenuClick(item)"
      >
        <image
          class="service-icon"
          :src="getIconUrl(index)"
          mode="aspectFill"
        />
        <text class="service-name">{{ item.name }}</text>
      </view>
    </view>

    <!-- 客服列表弹窗 -->
    <view v-if="showCustomerServicePopup" class="customer-service-popup-overlay" @click="hideCustomerServicePopup">
      <view class="customer-service-popup" @click.stop>
        <view class="popup-header">
          <text class="popup-title">联系客服</text>
          <view class="popup-close" @click="hideCustomerServicePopup">
            <text class="close-icon">×</text>
          </view>
        </view>

        <view class="popup-content">
          <!-- 加载状态 -->
          <view v-if="customerServiceLoading" class="loading-state">
            <text class="loading-text">加载中...</text>
          </view>

          <!-- 错误状态 -->
          <view v-else-if="customerServiceError" class="error-state">
            <text class="error-text">{{ customerServiceError }}</text>
            <button class="retry-btn" @click="fetchCustomerServiceList">重试</button>
          </view>

          <!-- 客服列表 -->
          <view v-else-if="customerServiceList.length > 0" class="customer-list">
            <view
              class="customer-item"
              v-for="customer in customerServiceList"
              :key="customer.id"
            >
              <!-- 微信二维码显示在最上面 -->
              <view v-if="customer.wechat_image" class="wechat-qr-top">
                <image
                  :src="getWechatImageUrl(customer.wechat_image)"
                  class="wechat-qr-image"
                  mode="aspectFit"
                  @click="saveWechatImage(customer)"
                />
                <text class="qr-save-tips">点击保存二维码</text>
              </view>

              <view class="customer-info">
                <text class="customer-name">{{ customer.name }}</text>
                <text class="customer-phone" v-if="customer.phone">电话：{{ customer.phone }}</text>
                <text class="customer-wechat" v-if="customer.wechat">微信：{{ customer.wechat }}</text>
              </view>

              <view class="customer-actions">
                <button
                  v-if="customer.phone"
                  class="action-btn phone-btn"
                  @click="callPhone(customer.phone)"
                >
                  拨打电话
                </button>
                <button
                  v-if="customer.wechat_image"
                  class="action-btn wechat-btn"
                  @click="saveWechatImage(customer)"
                >
                  保存二维码
                </button>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-else class="empty-state">
            <text class="empty-text">暂无可用的客服</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'
export default {
  name: 'MyService',
  data() {
    return {
      // 从后台获取到的图标数组（相对路径）
      iconImages: [],
      // 菜单项（定义名称与跳转/行为）
      menuList: [
        { name: '我的订单', path: '/pages/order/order' },
        { name: '我的收藏', path: '/pages/favorites/favorites' },
        { name: '联系客服', action: 'customerService' }
      ],
      loadingIcons: false,

      // 客服相关数据
      showCustomerServicePopup: false,
      customerServiceList: [],
      customerServiceLoading: false,
      customerServiceError: null,

    }
  },
  created() {
    this.fetchIconImages()
  },
  methods: {
    // 获取后台图片接口
    fetchIconImages() {
      if (this.loadingIcons) return
      this.loadingIcons = true
      const url = `${BASE_URL}/api/member/images`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            // 后端返回的 iconImages 可能是相对路径数组
            this.iconImages = resp.data.iconImages || []
          } else {
            console.warn('获取成员图片失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求成员图片失败', err)
        },
        complete: () => {
          this.loadingIcons = false
        }
      })
    },

    // 根据索引返回完整图片地址，优先使用接口图标，否则返回占位图
    getIconUrl(index) {
      const img = this.iconImages && this.iconImages[index]
      if (!img) {
        return ''
      }
      // 如果已经是完整URL则直接返回
      if (/^https?:\/\//i.test(img)) return img
      // 确保拼接 BASE_URL 与相对路径
      if (img.startsWith('/')) return `${BASE_URL}${img}`
      return `${BASE_URL}/${img}`
    },

    // 处理微信二维码图片URL，参考分类页面的图片处理方式
    getWechatImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      // 确保拼接时不会出现双斜杠
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },

    // 点击菜单逻辑：有 path 则跳转；有 action 则执行对应操作
    onMenuClick(item) {
      if (item.path) {
        uni.navigateTo({ url: item.path, fail: () => { uni.showToast({ title: '功能开发中', icon: 'none' }) } })
        return
      }
      if (item.action === 'customerService') {
        this.showCustomerServicePopup = true
        this.fetchCustomerServiceList()
      }
    },

    // 获取客服列表
    async fetchCustomerServiceList() {
      try {
        this.customerServiceLoading = true
        this.customerServiceError = null

        const response = await this.requestCustomerServiceList()

        if (response.code === 200 && response.data) {
          // 规范化微信二维码图片地址（若后端返回相对路径）
          this.customerServiceList = (response.data.list || []).map((customer) => {
            return Object.assign({}, customer, {
              wechat_image: this.getWechatImageUrl(customer.wechat_image)
            })
          })
        } else {
          throw new Error(response.message || '获取客服列表失败')
        }

      } catch (err) {
        console.error('获取客服列表失败:', err)
        this.customerServiceError = err.message || '获取客服列表失败，请重试'
        this.customerServiceList = []
      } finally {
        this.customerServiceLoading = false
      }
    },

    // 请求客服列表API
    requestCustomerServiceList() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `${BASE_URL}/api/customer-service/list`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data)
            } else {
              reject(new Error(`请求失败：${res.statusCode}`))
            }
          },
          fail: (err) => {
            reject(new Error('网络请求失败，请检查网络连接'))
          }
        })
      })
    },

    // 隐藏客服弹窗
    hideCustomerServicePopup() {
      this.showCustomerServicePopup = false
      this.customerServiceError = null
    },

    // 拨打电话
    callPhone(phone) {
      uni.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          uni.showToast({
            title: `拨打电话失败`,
            icon: 'none'
          })
        }
      })
    },

    // 保存微信二维码到本地
    async saveWechatImage(customer) {
      try {
        const imageUrl = this.getWechatImageUrl(customer.wechat_image)

        // #ifdef MP-WEIXIN
        // 微信小程序环境
        const downloadTask = uni.downloadFile({
          url: imageUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              uni.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  uni.showToast({
                    title: '保存成功',
                    icon: 'success'
                  })
                },
                fail: () => {
                  uni.showToast({
                    title: '保存失败',
                    icon: 'none'
                  })
                }
              })
            } else {
              uni.showToast({
                title: '下载失败',
                icon: 'none'
              })
            }
          },
          fail: () => {
            uni.showToast({
              title: '下载失败',
              icon: 'none'
            })
          }
        })
        // #endif

        // #ifndef MP-WEIXIN
        // 其他平台（如H5）提示用户右键保存
        uni.showModal({
          title: '保存图片',
          content: '请长按图片或右键保存到本地',
          showCancel: false
        })
        // #endif

      } catch (err) {
        console.error('保存图片失败:', err)
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.my-service {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
}

.service-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 6px 6px 12px;
}

.service-grid {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.service-item {
  width: 32%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
}

.service-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #f5f5f5;
  margin-bottom: 8px;
}

.service-name {
  font-size: 13px;
  color: #666;
}

/* 客服弹窗样式 */
.customer-service-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.customer-service-popup {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.popup-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-icon {
  font-size: 24px;
  color: #999;
  line-height: 1;
}

.popup-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px 0;
}

.loading-text {
  color: #666;
  font-size: 16px;
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-text {
  color: #ff4757;
  font-size: 16px;
  margin-bottom: 16px;
  display: block;
}

.retry-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
}

/* 客服列表 */
.customer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.customer-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.customer-info {
  margin-bottom: 12px;
}

.customer-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.customer-phone,
.customer-wechat {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.customer-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.phone-btn {
  background: #28a745;
  color: #fff;
}

.phone-btn:hover {
  background: #218838;
}

.wechat-btn {
  background: #07c160;
  color: #fff;
}

.wechat-btn:hover {
  background: #06a552;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-text {
  color: #999;
  font-size: 16px;
}

/* 微信二维码显示在顶部 */
.wechat-qr-top {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.wechat-qr-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: opacity 0.2s;
}

.wechat-qr-image:hover {
  opacity: 0.8;
}

.qr-save-tips {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

</style>
