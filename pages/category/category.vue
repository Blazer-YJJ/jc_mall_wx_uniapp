<!--
 * @Author: BlazerYJJ yangjijuna@gmail.com
 * @Date: 2026-01-13 16:00:51
 * @LastEditors: BlazerYJJ yangjijuna@gmail.com
 * @LastEditTime: 2026-01-13 16:11:27
 * @FilePath: \jc_mall_wx_uni\pages\category\category.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
	<view class="category-page">
		<!-- 左侧分类列表 + 右侧商品列表（两列卡片） -->
		<view class="container">
			<!-- 左侧：分类名称列表 -->
			<view class="sidebar">
				<scroll-view scroll-y class="category-list">
					<view
						class="category-item"
						:class="{ active: cat.id === selectedCategoryId }"
						v-for="cat in categories"
						:key="cat.id"
						@click="selectCategory(cat.id)"
					>
						<text class="category-name">{{ cat.name }}</text>
					</view>
				</scroll-view>
			</view>

			<!-- 右侧：商品网格 -->
			<view class="content">
				<scroll-view scroll-y class="product-scroll" @scrolltolower="onScrollToLower" scroll-with-animation>
					<view class="product-grid">
						<view class="product-card" v-for="product in products" :key="product.id" @click="openProduct(product)">
							<image :src="product.image" class="product-image" mode="aspectFill" />
							<view class="product-body">
								<text class="product-title" :title="product.name">{{ product.name }}</text>
								<view class="product-meta">
									<text class="price">¥{{ product.price }}</text>
								</view>
							</view>
						</view>
					</view>

					<view class="list-footer" v-if="loading">加载中...</view>
					<view class="list-empty" v-if="!loading && products.length === 0">暂无商品</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import { BASE_URL } from '@/common/config.js'

export default {
	name: 'Category',
	data() {
		return {
			categories: [], // 分类数据
			selectedCategoryId: null, // 当前选中分类ID
			products: [], // 当前分类下商品列表
			page: 1,
			pageSize: 10,
			total: 0,
			loading: false // 分页加载状态
		}
	},
	onLoad() {
		// 页面加载时先获取分类列表
		this.fetchCategories()
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
		// 打开商品详情
		openProduct(product) {
			if (!product || !product.id) return
			uni.navigateTo({ url: `/pages/product/product?id=${product.id}` })
		},

		/**
		 * 获取分类列表
		 */
		fetchCategories() {
			const url = `${BASE_URL}/api/product/category/list`
			uni.request({
				url,
				method: 'GET',
				success: (res) => {
					const resp = res.data
					if (resp && resp.code === 200) {
						// 规范化分类图片地址（若后端返回相对路径）
						this.categories = (resp.data || []).map((cat) => {
							return Object.assign({}, cat, { image: this.getImageUrl(cat.image) })
						})
						// 默认选中第一个分类并加载商品
						if (this.categories.length > 0) {
							this.selectedCategoryId = this.categories[0].id
							this.resetAndFetchProducts()
						}
					} else {
						uni.showToast({ title: (resp && resp.message) || '分类获取失败', icon: 'none' })
					}
				},
				fail: () => {
					uni.showToast({ title: '请求分类失败，请检查网络', icon: 'none' })
				}
			})
		},

		/**
		 * 重置分页并重新加载商品列表
		 */
		resetAndFetchProducts() {
			this.page = 1
			this.products = []
			this.total = 0
			this.fetchProducts(true)
		},

		/**
		 * 获取商品列表
		 * @param {Boolean} reset 是否重置列表（用于切换分类时）
		 */
		fetchProducts(reset = false) {
			if (this.loading) return
			this.loading = true

			const params = {
				page: this.page,
				pageSize: this.pageSize
			}
			if (this.selectedCategoryId) {
				params.categoryId = this.selectedCategoryId
			}

			const url = `${BASE_URL}/api/product/list`
			uni.request({
				url,
				method: 'GET',
				data: params,
				success: (res) => {
					const resp = res.data
					if (resp && resp.code === 200 && resp.data) {
						// 规范化商品图片地址
						const list = (resp.data.list || []).map((p) =>
							Object.assign({}, p, { image: this.getImageUrl(p.image) })
						)
						this.total = resp.data.total || 0
						// 如果是重置，则直接替换；否则追加（分页）
						if (reset) {
							this.products = list
						} else {
							this.products = this.products.concat(list)
						}
						// 如果本次返回数量等于 pageSize 则页码 +1，准备下次加载
						if (list.length === this.pageSize) {
							this.page += 1
						}
					} else {
						uni.showToast({ title: (resp && resp.message) || '商品获取失败', icon: 'none' })
					}
				},
				fail: () => {
					uni.showToast({ title: '请求商品失败，请检查网络', icon: 'none' })
				},
				complete: () => {
					this.loading = false
				}
			})
		},

		/**
		 * 点击左侧分类项
		 */
		selectCategory(categoryId) {
			if (this.selectedCategoryId === categoryId) return
			this.selectedCategoryId = categoryId
			this.resetAndFetchProducts()
		},

		/**
		 * 列表滚动到底部触发加载更多
		 */
		onScrollToLower() {
			// 如果已经加载完全部则不再请求
			if (this.products.length >= this.total && this.total !== 0) return
			this.fetchProducts(false)
		}
	}
}
</script>

<style scoped>
.category-page {
	min-height: 100vh;
	background: #fff;
}
.container {
	display: flex;
	flex-direction: row;
	/* 整体使用视口高度，确保左右列各自独立滚动 */
	height: 100vh;
}
.sidebar {
	width: 120px;
	border-right: 1px solid #f0f0f0;
	background: #ffffff;
}
.category-list {
	padding: 8px 0;
	/* 左侧分类区域固定在视口高度内并独立滚动，不随右侧内容滚动影响 */
	height: 100%;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}
.category-item {
	padding: 12px 10px;
	text-align: center;
	color: #666;
}
.category-item.active {
	background: #fff6ea;
	color: #d2691e;
	border-left: 3px solid #d2691e;
}
.category-name {
	font-size: 14px;
}
.content {
	flex: 1;
	padding: 8px;
	background: #fff;
}
.product-scroll {
	/* 右侧商品滚动区域独立于左侧，使用视口高度以确保滚动不影响左侧 */
	height: 100vh;
	overflow-y: auto;
}
.product-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}
.product-card {
	width: 48%;
	background: #fff;
	border-radius: 6px;
	overflow: hidden;
	margin-bottom: 12px;
	box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.product-image {
	width: 100%;
	height: 120px;
	background: #f6f6f6;
}
.product-body {
	padding: 8px;
}
.product-title {
	display: block;
	font-size: 14px;
	color: #333;
	height: 36px;
	line-height: 18px;
	overflow: hidden;
	text-overflow: ellipsis;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
.product-meta {
	margin-top: 6px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.price {
	color: #d2691e;
	font-weight: bold;
}
.list-footer, .list-empty {
	text-align: center;
	padding: 12px 0;
	color: #999;
}
</style>
