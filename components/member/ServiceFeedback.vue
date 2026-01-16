<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-15 10:00:00
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-16 21:39:34
 * @FilePath: \jc_mall_wx_uni\components\member\ServiceFeedback.vue
 * @Description: 服务反馈模块
-->
<template>
  <view class="service-feedback">
    <!-- 标题 -->
    <view class="feedback-title">关于反馈</view>

    <!-- 列表项 -->
    <view class="feedback-list">
      <view class="feedback-item" @click="openAbout">
        <text class="item-title">关于我们</text>
        <text class="item-arrow">›</text>
      </view>
      <view class="feedback-item" @click="openOpinion">
        <text class="item-title">意见反馈</text>
        <text class="item-arrow">›</text>
      </view>
    </view>

    <!-- 关于我们弹窗（-->
    <view v-if="showAboutModal" class="about-modal-overlay" @click="closeAboutModal">
      <view class="about-modal" @click.stop>
        <!-- 关闭按钮 -->
        <view class="modal-close" @click="closeAboutModal">
          <text class="close-icon">×</text>
        </view>

        <!-- 标题 -->
        <view class="modal-title">{{ aboutData.title }}</view>

        <!-- 图片轮播 -->
        <view v-if="aboutData.images && aboutData.images.length > 0" class="modal-images">
          <swiper class="image-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :circular="true">
            <swiper-item v-for="(image, index) in aboutData.images" :key="index">
              <image :src="image" class="swiper-image" mode="aspectFill" />
            </swiper-item>
          </swiper>
        </view>

        <!-- 内容 -->
        <scroll-view class="modal-content" scroll-y="true">
          <text class="content-text">{{ aboutData.content }}</text>

          <!-- 所有返回字段渲染（snake_case） -->
          <view class="contact-info">
            <view v-if="aboutData.id !== undefined" class="info-item">
              <text class="info-label">ID：</text>
              <text class="info-value">{{ aboutData.id }}</text>
            </view>
            <view v-if="aboutData.contact_phone" class="info-item">
              <text class="info-label">联系电话：</text>
              <text class="info-value">{{ aboutData.contact_phone }}</text>
            </view>
            <view v-if="aboutData.contact_address" class="info-item">
              <text class="info-label">联系地址：</text>
              <text class="info-value">{{ aboutData.contact_address }}</text>
            </view>
            <view v-if="aboutData.business_hours" class="info-item">
              <text class="info-label">营业时间：</text>
              <text class="info-value">{{ aboutData.business_hours }}</text>
            </view>
            <view v-if="aboutData.status !== undefined" class="info-item">
              <text class="info-label">状态：</text>
              <text class="info-value">{{ aboutData.status }}</text>
            </view>
            <view v-if="aboutData.create_time" class="info-item">
              <text class="info-label">创建时间：</text>
              <text class="info-value">{{ aboutData.create_time }}</text>
            </view>
            <view v-if="aboutData.update_time" class="info-item">
              <text class="info-label">更新时间：</text>
              <text class="info-value">{{ aboutData.update_time }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 意见反馈弹窗 -->
    <view v-if="showFeedbackModal" class="feedback-modal-overlay" @click="closeFeedbackModal">
      <view class="feedback-modal" @click.stop>
        <!-- 关闭按钮 -->
        <view class="modal-close" @click="closeFeedbackModal">
          <text class="close-icon">×</text>
        </view>

        <!-- 标题 -->
        <view class="modal-title">意见反馈</view>

        <!-- 表单 -->
        <scroll-view class="modal-content" scroll-y="true">
          <view class="form-group">
            <text class="form-label">反馈人姓名 *</text>
            <input
              class="form-input"
              v-model="feedbackForm.name"
              placeholder="请输入您的姓名"
              maxlength="50"
            />
          </view>

          <view class="form-group">
            <text class="form-label">联系邮箱</text>
            <input
              class="form-input"
              v-model="feedbackForm.email"
              placeholder="请输入您的邮箱"
              type="email"
              maxlength="100"
            />
          </view>

          <view class="form-group">
            <text class="form-label">联系电话</text>
            <input
              class="form-input"
              v-model="feedbackForm.phone"
              placeholder="请输入您的联系电话"
              type="number"
              maxlength="20"
            />
          </view>

          <view class="form-group">
            <text class="form-label">反馈内容 *</text>
            <textarea
              class="form-textarea"
              v-model="feedbackForm.content"
              placeholder="请详细描述您的意见或建议..."
              :maxlength="500"
              auto-height
            />
            <text class="form-tip">{{ feedbackForm.content.length }}/500</text>
          </view>
        </scroll-view>

        <!-- 提交按钮 -->
        <view class="modal-footer">
          <button
            class="submit-btn"
            :disabled="!isFormValid || isSubmitting"
            @click="submitFeedback"
          >
            {{ isSubmitting ? '提交中...' : '提交反馈' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'ServiceFeedback',
  data() {
    return {
      showAboutModal: false,
      showFeedbackModal: false,
      isSubmitting: false,
      aboutData: {
        id: null,
        title: '',
        content: '',
        images: [],
        contact_phone: '',
        contact_address: '',
        business_hours: '',
        status: null,
        create_time: '',
        update_time: ''
      },
      feedbackForm: {
        name: '',
        email: '',
        phone: '',
        content: ''
      }
    }
  },
  computed: {
    isFormValid() {
      return this.feedbackForm.name.trim() && this.feedbackForm.content.trim()
    }
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
    async openAbout() {
      try {
        // 显示加载中
        uni.showLoading({ title: '加载中...' });

        // 调用API获取关于我们数据
        const res = await uni.request({
          url: `${BASE_URL}/api/store/about`,
          method: 'GET'
        });

        if (res.data && res.data.code === 200) {
          // 规范化并映射 snake_case 字段到 aboutData（保留 snake_case 字段名）
          const src = res.data.data || {};
          const mapped = {
            id: src.id,
            title: src.title || '',
            content: src.content || '',
            images: Array.isArray(src.images) ? src.images.map(url => this.getImageUrl(url)) : [],
            contact_phone: src.contact_phone || src.contactPhone || '',
            contact_address: src.contact_address || src.contactAddress || '',
            business_hours: src.business_hours || src.businessHours || '',
            status: src.status,
            create_time: src.create_time || src.createTime || '',
            update_time: src.update_time || src.updateTime || ''
          }
          this.aboutData = mapped;
          this.showAboutModal = true;
        } else {
          uni.showToast({ title: '获取数据失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取关于我们数据失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    closeAboutModal() {
      this.showAboutModal = false;
    },
    openOpinion() {
      // 显示意见反馈弹窗
      this.showFeedbackModal = true;
    },
    closeFeedbackModal() {
      if (!this.isSubmitting) {
        this.showFeedbackModal = false;
        this.resetFeedbackForm();
      }
    },
    resetFeedbackForm() {
      this.feedbackForm = {
        name: '',
        email: '',
        phone: '',
        content: ''
      };
    },
    async submitFeedback() {
      if (!this.isFormValid || this.isSubmitting) return;

      try {
        this.isSubmitting = true;
        uni.showLoading({ title: '提交中...' });

        // 读取 token（兼容不同存储 key，优先使用 member_token）
        const token = uni.getStorageSync('member_token') || uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || '';
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          // 跳转到会员页显示登录表单
          uni.navigateTo({ url: '/pages/member/member' });
          return;
        }

        const payload = {
          name: this.feedbackForm.name.trim(),
          email: this.feedbackForm.email.trim(),
          phone: this.feedbackForm.phone.trim(),
          content: this.feedbackForm.content.trim()
        };

        const res = await uni.request({
          url: `${BASE_URL}/api/feedback/create`,
          method: 'POST',
          data: payload,
          dataType: 'json',
          header: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        const resp = res.data || {};
        if (resp && resp.code === 200) {
          uni.showToast({ title: '反馈提交成功', icon: 'success' });
          // 关闭并重置表单
          this.resetFeedbackForm();
          this.showFeedbackModal = false;
        } else {
          const errorMsg = resp.message || '提交失败，请重试';
          uni.showToast({ title: errorMsg, icon: 'none' });
        }
      } catch (error) {
        console.error('提交反馈失败:', error);
        uni.showToast({ title: '网络错误，请重试', icon: 'none' });
      } finally {
        this.isSubmitting = false;
        uni.hideLoading();
      }
    }
  }
}
</script>

<style scoped>
.service-feedback {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.feedback-title {
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
}

.feedback-list {
  padding: 0 15px;
}

.feedback-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.feedback-item:last-child {
  border-bottom: none;
}

.item-title {
  font-size: 15px;
  color: #333;
}

.item-arrow {
  color: #ccc;
  font-size: 14px;
  /* 保证在小字号下对齐，可使用等宽字体以避免显示为 &gt; 等实体 */
  font-family: inherit;
  line-height: 1;
}

/* 关于我们弹窗样式 */
.about-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.about-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  z-index: 1;
  cursor: pointer;
}

.close-icon {
  font-size: 18px;
  color: #666;
  line-height: 1;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-align: center;
  padding: 20px 15px 15px 15px;
  border-bottom: 1px solid #f5f5f5;
  margin-top: 10px;
}

.modal-images {
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.image-swiper {
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

.modal-content {
  flex: 1;
  padding: 15px;
  /* 增大滚动区域高度以避免输入框被遮挡 */
  max-height: 360px;
  width: 92%;
}

.content-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  display: block;
}

.contact-info {
  border-top: 1px solid #f5f5f5;
  padding-top: 15px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

/* 意见反馈弹窗样式 */
.feedback-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.feedback-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-footer {
  padding: 15px;
  border-top: 1px solid #f5f5f5;
}

.submit-btn {
  width: 100%;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:disabled {
  background: #ccc;
  color: #999;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  /* 明确内边距与高度，使用 border-box 避免宽度被 padding 推大 */
  padding: 10px 14px;
  height: 44px;
  line-height: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #007aff;
  outline: none;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  /* 增加最小高度并提升行高，保证多行文本不会被裁切 */
  min-height: 120px;
  line-height: 1.6;
  box-sizing: border-box;
  resize: none;
  overflow: auto;
}

.form-textarea:focus {
  border-color: #007aff;
  outline: none;
}

.form-tip {
  display: block;
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 4px;
}
</style>
