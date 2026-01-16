<template>
  <view class="activity-module">
    <!-- 模块标题 -->
    <view class="module-header">
      <text class="module-title">本店活动</text>
    </view>
    <!-- 活动模块：渲染最新活动，点击预留跳转 -->
    <view class="activity-list" v-if="activities.length">
      <view class="activity-item" v-for="item in activities" :key="item.id" @click="onActivityClick(item)">
        <image :src="item.image" class="thumb" mode="aspectFill" @error="onImageError($event, item)" />
        <text class="title">{{ item.title }}</text>
        <text class="desc" v-if="item.content">{{ item.content }}</text>
      </view>
    </view>
    <view class="activity-empty" v-else>
      <text>暂无活动</text>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'ActivityModule',
  data() {
    return {
      activities: [],
      loading: false
    }
  },
  created() {
    this.fetchActivities()
  },
  methods: {
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },
    fetchActivities() {
      if (this.loading) return
      this.loading = true
      const url = `${BASE_URL}/api/activity/latest`
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          const resp = res.data
          if (resp && resp.code === 200 && resp.data && resp.data.list) {
            this.activities = (resp.data.list || []).map(a => ({
              id: a.id,
              title: a.title,
              content: a.content,
              image: this.getImageUrl(a.image || a.banner_url || '')
            }))
          } else {
            console.warn('获取活动失败', resp && resp.message)
          }
        },
        fail: (err) => {
          console.warn('请求活动失败', err)
        },
        complete: () => {
          this.loading = false
        }
      })
    },
    onImageError(e, item) {
      if (item) item.image = ''
    },
    onActivityClick(item) {
      // 预留跳转逻辑，例如跳转活动页或商品详情
      // uni.navigateTo({ url: `/pages/activity/detail?id=${item.id}` })
    }
  }
}
</script>

<style scoped>
.activity-list {
  display: flex;
  flex-direction: row;
  padding: 12px;
  justify-content: space-between;
}
.activity-item {
  width: 30%;
  align-items: center;
}
.thumb {
  height: 80px;
  background: #f6f6f6;
  border-radius: 6px;
  margin-bottom: 8px;
  width: 100%;
}
.title {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
}
.desc {
  font-size: 11px;
  color: #888;
}
.activity-empty {
  padding: 12px;
  color: #999;
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


