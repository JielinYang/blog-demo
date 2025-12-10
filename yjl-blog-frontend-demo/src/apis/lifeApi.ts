import request from '@/utils/request'

// 生活碎片接口类型定义（匹配后端的 camelCase 格式）
export interface LifeFragment {
  id?: number
  content: string
  imageUrl?: string      // 后端使用 imageUrl
  mood: string
  weather: string
  recordTime: string     // 后端使用 recordTime
  createdAt?: string     // 后端使用 createdAt
  updatedAt?: string     // 后端使用 updatedAt
}

// 获取所有生活碎片
export function getLifeFragments() {
  return request.get('/api/life/fragments', {})
}

// 创建生活碎片
export function createLifeFragment(data: LifeFragment) {
  return request.post('/api/life/fragments', data)
}

// 获取单个生活碎片详情
export function getLifeFragmentById(id: number) {
  return request.get(`/api/life/fragments/${id}`, {})
}

// 删除生活碎片
export function deleteLifeFragment(id: number) {
  return request.delete(`/api/life/fragments/${id}`)
}
