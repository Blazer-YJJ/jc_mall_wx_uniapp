import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'

// 注意：已移除全局 API 挂载（common/api.js、common/config.js 已删除）

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)

  // 注意：已移除全局 API 挂载（common/api.js、common/config.js 已删除）

  return {
    app
  }
}
// #endif