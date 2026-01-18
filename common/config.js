/**
 * 后端请求基础 URL 配置
 * 在项目中使用示例：
 * import { BASE_URL } from '@/common/config.js'
 *
 * 请根据不同环境（开发/生产）在此处调整为相应的后端地址。
 */
const BASE_URL = 'http://192.168.0.109:3000'

// 命名导出 BASE_URL，便于按需引用和单元测试
export {
	BASE_URL
}