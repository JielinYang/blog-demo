import request from '@/utils/request'

export const getArticles = (page: number, limit: number) => {
  return request.get('/articles', { page, limit })
}
