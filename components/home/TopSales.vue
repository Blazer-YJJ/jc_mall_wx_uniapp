<template>
  <view class="top-sales">
    <!-- 模块标题 -->
    <view class="module-header">
      <text class="module-title">销量榜单</text>
    </view>
    <!-- 加载中 -->
    <view v-if="loading" class="list">
      <view class="item" v-for="i in 3" :key="'loading-'+i">
        <text class="rank">{{ i }}</text>
        <text class="name">加载中...</text>
        <text class="num">--</text>
      </view>
    </view>

    <!-- 错误提示 -->
    <view v-else-if="error" class="list">
      <view class="item">
        <text class="name">{{ error }}</text>
        <button @click="fetchTopSales">重试</button>
      </view>
    </view>

    <!-- 列表内容 -->
    <view v-else class="list">
      <view class="item" v-for="(p, idx) in topSales" :key="p.id || idx" @click="openProduct(p)">
        <text class="rank">{{ idx + 1 }}</text>
        <text class="name">{{ p.productName }}</text>
        <text class="num">已售 {{ p.salesCount || p.sales_count || p.sales || 0 }}</text>
      </view>
      <view v-if="!topSales.length" class="item">
        <text class="name">暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
  name: 'TopSales',
  data() {
    return {
      topSales: [],
      loading: true,
      error: null
    }
  },
  created() {
    this.fetchTopSales()
  },
  methods: {
    // 规范化图片地址
    getImageUrl(url) {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      if (url.startsWith('/')) return `${BASE_URL}${url}`
      return `${BASE_URL}/${url}`
    },

    // 获取热销数据
    async fetchTopSales() {
      try {
        this.loading = true
        this.error = null
        const response = await uni.request({
          url: `${BASE_URL}/api/activity/hot`,
          method: 'GET'
        })

        if (response.statusCode === 200 && response.data && response.data.code === 200) {
          const list = (response.data.data || []).map((p) => {
            return Object.assign({}, p, {
              productImage: this.getImageUrl(p.productImage || p.product_image || p.image || ''),
              productName: p.productName || p.product_name || p.name || ''
            })
          })
          this.topSales = list
        } else {
          this.error = (response.data && response.data.message) || '获取热销榜失败'
        }
      } catch (err) {
        console.error('获取热销榜失败:', err)
        this.error = '网络异常，请稍后重试'
      } finally {
        this.loading = false
      }
    },

    // 图片加载失败处理
    handleImageError(item) {
      if (item) item.productImage = ''
    }
    ,
    // 跳转到商品详情页
    openProduct(product) {
      if (!product) return
      // 优先使用 productId（榜单项中的商品 id 字段），避免使用榜单记录的 id
      const id = product.productId || product.product_id
      if (!id) return
      uni.navigateTo({ url: `/pages/product/product?id=${id}` })
    }
  }
}
</script>

<style scoped>
.list {
  padding: 12px;
}
.item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f2;
}
.rank {
  width: 24px;
  color: #d2691e;
  font-weight: bold;
}
.name {
  flex: 1;
  margin-left: 8px;
  color: #333;
}
.num {
  color: #999;
}

/* 模块标题样式 */
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