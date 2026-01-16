<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-13 16:01:06
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-15 10:30:00
 * @FilePath: \jc_mall_wx_uni\pages\member\member.vue
 * @Description: 会员中心页面 - 展示会员信息、服务和反馈功能
-->
<template>
  <view class="member-page">
    <!-- 会员中心内容：各模块按顺序展示 -->
    <MemberCard />
    <MyService />
    <ServiceFeedback />
  </view>
</template>

<script>
import MemberCard from '@/components/member/MemberCard.vue'
import MyService from '@/components/member/MyService.vue'
import ServiceFeedback from '@/components/member/ServiceFeedback.vue'

export default {
  name: 'Member',
  components: {
    MemberCard,
    MyService,
    ServiceFeedback
  },
  data() {
    return {

    }
  },
  onLoad() {

  },
  methods: {

  }
}
</script>

<style scoped>
/* 会员中心页面样式 */
.member-page {
  padding-bottom: 18px;
  background: #f8f9fa;
  min-height: 100vh;
}
</style>
