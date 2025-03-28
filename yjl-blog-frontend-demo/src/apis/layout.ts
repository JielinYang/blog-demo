import request from '@/utils/request'

export const getCategoryList = () => {
  return request.get('/api/category', {})
}
