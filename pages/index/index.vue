<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-13 16:00:44
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-15 02:37:14
 * @FilePath: \jc_mall_wx_uni\pages\index\index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <view class="home-page">
    <!-- 首页内容：各模块按顺序展示 -->
    <Announcement />
    <CarouselModule />
    <ActivityModule />
    <RecommendedProducts />
    <TopSales />
  </view>
</template>

<script>
import OrderModule from '@/components/home/OrderModule.vue'
import CarouselModule from '@/components/home/CarouselModule.vue'
import ActivityModule from '@/components/home/ActivityModule.vue'
import RecommendedProducts from '@/components/home/RecommendedProducts.vue'
import TopSales from '@/components/home/TopSales.vue'
import Announcement from '@/components/home/Announcement.vue'

export default {
  name: 'Index',
  components: {
    OrderModule,
    Announcement,
    CarouselModule,
    ActivityModule,
    RecommendedProducts,
    TopSales
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
.home-page {
  padding-bottom: 18px;
  background: #fff;
}
</style>
