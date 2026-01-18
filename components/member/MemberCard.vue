<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-15 10:00:00
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-18 03:41:51
 * @FilePath: \jc_mall_wx_uni\components\member\MemberCard.vue
 * @Description: 会员卡片模块 - 登录状态管理和会员信息展示
-->
<template>
  <view class="member-card">
    <!-- 会员卡片：登录状态展示和登录表单 -->
    <view class="card-container" v-if="isLoggedIn">
      <!-- 已登录状态：显示会员信息 -->
      <view class="logged-in-card">
        <view class="user-header">
          <image class="avatar" :src="memberInfo.avatar" mode="aspectFill"></image>
          <view class="user-info">
            <text class="nickname">{{ memberInfo.nickname || memberInfo.username }}</text>
            <text class="welcome">欢迎回来！</text>
          </view>
        </view>
        <view class="logout-btn" @click="handleLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </view>

    <view class="card-container" v-else>
      <!-- 未登录状态：登录表单 -->
      <view class="login-card">
        <view class="login-header">
          <text class="login-title">会员登录</text>
          <text class="login-subtitle">登录享受更多优惠</text>
        </view>

        <view class="login-form">
          <view class="form-item">
            <input
              class="input-field"
              type="text"
              placeholder="请输入用户名"
              placeholder-style="color:#bfbfbf;font-size:14px;"
              v-model="loginForm.username"
              @input="onUsernameInput"
            />
          </view>
          <view class="form-item">
            <input
              class="input-field"
              type="password"
              password
              placeholder="请输入密码"
              placeholder-style="color:#bfbfbf;font-size:14px;"
              v-model="loginForm.password"
              @input="onPasswordInput"
            />
          </view>

          <view class="login-btn" @click="canLogin && handleLogin()" :class="{ disabled: !canLogin }">
            <text class="login-btn-text">{{ isLogging ? '登录中...' : '登录' }}</text>
          </view>

          <view class="divider">
            <text class="divider-text">或</text>
          </view>

          <view class="wechat-login-btn" @click="handleWechatLogin">
            <text class="wechat-login-text">微信一键登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'MemberCard',
  data() {
    return {
      // 登录状态
      isLoggedIn: false,
      isLogging: false,

      // 登录表单数据
      loginForm: {
        username: '',
        password: ''
      },

      // 会员信息
      memberInfo: {
        id: null,
        username: '',
        nickname: '',
        avatar: ''
      }
    }
  },
  computed: {
    // 计算是否可以登录
    canLogin() {
      return this.loginForm.username.trim() && this.loginForm.password.trim() && !this.isLogging
    }
  },
  created() {
    // 组件创建时检查登录状态
    this.checkLoginStatus()
    // 同步获取会员相关图片（头像等）
    this.fetchMemberImages()
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      try {
        // 从本地存储获取token和用户信息
        const token = uni.getStorageSync('member_token')
        const memberData = uni.getStorageSync('member_info')

        if (token && memberData) {
          this.isLoggedIn = true
          this.memberInfo = memberData
        }
      } catch (error) {
        console.warn('检查登录状态失败', error)
        this.clearLoginData()
      }
    },

    // 账号密码登录
    async handleLogin() {
      if (!this.canLogin) return

      this.isLogging = true
      try {
        const url = `${BASE_URL}/api/account/member/login`
        const response = await this.request({
          url,
          method: 'POST',
          data: {
            username: this.loginForm.username.trim(),
            password: this.loginForm.password.trim()
          }
        })

        if (response.code === 200) {
          // 登录成功
          this.isLoggedIn = true
          this.memberInfo = response.data.member

          // 保存登录信息到本地存储
          uni.setStorageSync('member_token', response.data.token)
          uni.setStorageSync('member_info', response.data.member)

          // 清空表单
          this.loginForm.username = ''
          this.loginForm.password = ''

          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 通知父组件或全局状态更新
          this.$emit('login-success', response.data)
        } else {
          uni.showToast({
            title: response.message || '登录失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('登录失败', error)
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      } finally {
        this.isLogging = false
      }
    },

    // 微信一键登录
    async handleWechatLogin() {
      if (this.isLogging) return

      this.isLogging = true
      try {
        // 显示加载提示
        uni.showLoading({
          title: '正在登录...'
        })

        // 第一步：调用微信登录获取授权码
        const loginResult = await this.wechatLogin()

        // 第二步：调用后端API进行登录/注册
        const response = await this.requestWechatLogin(loginResult.code)

        // 第三步：处理登录成功
        await this.handleWechatLoginSuccess(response)

      } catch (error) {
        console.error('微信登录失败', error)
        this.handleWechatLoginError(error)
      } finally {
        this.isLogging = false
        uni.hideLoading()
      }
    },

    // 微信小程序登录获取授权码
    wechatLogin() {
      return new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: (res) => {
            if (res.code) {
              resolve(res)
            } else {
              reject(new Error('获取微信授权码失败'))
            }
          },
          fail: (error) => {
            reject(new Error('微信登录调用失败：' + error.errMsg))
          }
        })
      })
    },

    // 调用后端微信登录API
    async requestWechatLogin(code) {
      const url = `${BASE_URL}/api/account/member/wechat-login`
      return await this.request({
        url,
        method: 'POST',
        data: {
          code: code
        }
      })
    },

    // 处理微信登录成功
    async handleWechatLoginSuccess(response) {
      if (response.code === 200) {
        // 登录成功
        this.isLoggedIn = true
        this.memberInfo = response.data.member

        // 保存登录信息到本地存储
        uni.setStorageSync('member_token', response.data.token)
        uni.setStorageSync('member_info', response.data.member)

        // 显示成功提示
        const isNewUser = response.data.isNewUser
        const successMsg = isNewUser ? '注册并登录成功' : '登录成功'

        uni.showToast({
          title: successMsg,
          icon: 'success',
          duration: 2000
        })

        // 通知父组件或全局状态更新
        this.$emit('login-success', response.data)
      } else {
        throw new Error(response.message || '登录失败')
      }
    },

    // 处理微信登录错误
    handleWechatLoginError(error) {
      let errorMsg = '登录失败'

      if (error.message) {
        errorMsg = error.message
      } else if (error.errMsg) {
        errorMsg = error.errMsg
      }

      // 根据不同错误类型显示相应提示
      if (errorMsg.includes('授权码')) {
        errorMsg = '获取微信授权失败，请重试'
      } else if (errorMsg.includes('网络')) {
        errorMsg = '网络连接失败，请检查网络后重试'
      } else if (errorMsg.includes('拒绝')) {
        errorMsg = '您拒绝了微信授权'
      }

      uni.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      })
    },

    // 退出登录
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            this.logout()
          }
        }
      })
    },

    // 执行退出登录
    logout() {
      this.clearLoginData()
      uni.showToast({
        title: '已退出登录',
        icon: 'success'
      })

      // 通知父组件或全局状态更新
      this.$emit('logout-success')
    },

    // 清空登录数据
    clearLoginData() {
      this.isLoggedIn = false
      this.memberInfo = {
        id: null,
        username: '',
        nickname: '',
        avatar: ''
      }

      try {
        uni.removeStorageSync('member_token')
        uni.removeStorageSync('member_info')
      } catch (error) {
        console.warn('清空本地数据失败', error)
      }
    },

    // 封装请求方法
    request(options) {
      return new Promise((resolve, reject) => {
        uni.request({
          ...options,
          success: (res) => {
            resolve(res.data)
          },
          fail: (error) => {
            reject(error)
          }
        })
      })
    },

    // 获取会员图片（头像等），使用 /api/member/images
    fetchMemberImages() {
      if (this.loadingImages) return
      this.loadingImages = true
      const url = `${BASE_URL}/api/member/images`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data) {
            const avatar = resp.data.avatarImage
            if (avatar) {
              // 拼接完整地址
              if (/^https?:\/\//i.test(avatar)) {
                this.memberInfo.avatar = avatar
              } else if (avatar.startsWith('/')) {
                this.memberInfo.avatar = `${BASE_URL}${avatar}`
              } else {
                this.memberInfo.avatar = `${BASE_URL}/${avatar}`
              }
            }
          } else {
            console.warn('获取会员图片失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求会员图片失败', err)
        },
        complete: () => {
          this.loadingImages = false
        }
      })
    },

    // 输入处理方法
    onUsernameInput(e) {
      this.loginForm.username = e.detail.value
    },

    onPasswordInput(e) {
      this.loginForm.password = e.detail.value
    }
  }
}
</script>

<style scoped>
.member-card {
  padding: 12px;
  display: flex;
  justify-content: center;
  background: transparent;
}

.card-container {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 已登录状态样式 */
.logged-in-card {
  padding: 20px;
  background: linear-gradient(135deg, #fff6ea 0%, #fff0e0 100%);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin-right: 15px;
  border: 2px solid rgba(210, 105, 30, 0.2);
}

.user-info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.welcome {
  display: block;
  font-size: 14px;
  color: #d2691e;
}

.logout-btn {
  background: #d2691e;
  border-radius: 20px;
  padding: 8px 16px;
  text-align: center;
}

.logout-btn:active {
  opacity: 0.8;
}

.logout-text {
  color: white;
  font-size: 14px;
}

/* 未登录状态样式 */
.login-card {
  padding: 20px 16px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.login-subtitle {
  display: block;
  font-size: 14px;
  color: #999;
}

.login-form {
  width: 100%;
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 16px;
}

.input-field {
  width: 100%;
  /* 固定高度，垂直居中显示文字，避免在不同平台出现文字偏移 */
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
  box-sizing: border-box;
  color: #333;
}

.input-field:focus {
  border-color: #d2691e;
  background: #fff;
}

.login-btn {
  width: 100%;
  background: #d2691e;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  text-align: center;
  margin-top: 8px;
  box-sizing: border-box;
  display: block;
}

.login-btn.disabled {
  background: #ccc;
}

.login-btn:active:not(.disabled) {
  opacity: 0.8;
}

.login-btn-text {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  background: white;
  padding: 0 12px;
  color: #999;
  font-size: 12px;
}

.wechat-login-btn {
  width: 100%;
  border: 1px solid #d2691e;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  text-align: center;
  background: #fff;
  box-sizing: border-box;
  display: block;
}

.wechat-login-btn:active {
  background: #f8f8f8;
}

.wechat-login-text {
  color: #d2691e;
  font-size: 16px;
  font-weight: bold;
}
</style>
