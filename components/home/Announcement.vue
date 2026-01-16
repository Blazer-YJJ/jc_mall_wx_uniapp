<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-14 02:57:48
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-14 03:17:56
 * @FilePath: \jc_mall_wx_uni\components\home\Announcement.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <view class="announcement">
    <!-- 公告信息：从接口拉取并显示首条公告（没有则显示占位） -->
    <view class="announcement-box" @click="onAnnouncementClick">
      <text class="bullet">公告：</text>
      <text class="message" v-if="announcement">{{ announcement.content }}</text>
      <text class="message" v-else>欢迎光临，更多优惠请关注活动专区！</text>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'Announcement',
  data() {
    return {
      announcementList: [],
      announcement: null,
      loading: false
    }
  },
  created() {
    // 组件创建时拉取公告
    this.fetchAnnouncements()
  },
  methods: {
    // 从后端获取公告列表
    fetchAnnouncements() {
      if (this.loading) return
      this.loading = true
      const url = `${BASE_URL}/api/announcement`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data && resp.data.list) {
            this.announcementList = resp.data.list || []
            // 优先显示置顶或第一条
            const top = this.announcementList.find((a) => a.isTop === 1)
            this.announcement = top || this.announcementList[0] || null
          } else {
            // 保持占位文案，提示错误
            console.warn('公告获取失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求公告失败', err)
        },
        complete: () => {
          this.loading = false
        }
      })
    },
    // 点击公告（可扩展为跳转详情）
    onAnnouncementClick() {
      // 预留：点击可跳转到公告详情页或活动页
      // if (this.announcement) { uni.navigateTo({ url: `/pages/announcement/detail?id=${this.announcement.id}` }) }
    }
  }
}
</script>

<style scoped>
.announcement-box {
  margin: 12px;
  padding: 8px 10px;
  background: #fff8f0;
  border-radius: 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.bullet {
  color: #d2691e;
  font-weight: bold;
  margin-right: 6px;
}
.message {
  color: #666;
  font-size: 13px;
}
</style>


