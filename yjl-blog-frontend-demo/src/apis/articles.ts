import request from '@/utils/request'

export const getArticles = (page: number, limit: number) => {
  return request.get('/articles', { page, limit })
}

export const getArticleDetail = (id: number | string) => {
  return request.get(`/articles/${id}`, {})
}

export const saveArticle = (data: {
  id?: number
  title: string
  content: string
  tags?: string[]
  category?: string
  categoryId?: number
  description?: string
  coverUrl?: string
  status?: number
  views?: number
  likeCount?: number
  commentCount?: number
}) => {
  return request.post(`/articles/save`, data)
}

// 更新文章
export const updateArticle = (id: number, data: {
  title?: string
  content?: string
  tags?: string[]
  category?: string
  categoryId?: number
  description?: string
  coverUrl?: string
  status?: number
  views?: number
  likeCount?: number
  commentCount?: number
}) => {
  return request.put(`/articles/${id}`, data)
}

// 删除文章
export const deleteArticle = (id: number) => {
  return request.delete(`/articles/${id}`)
}

// 获取文章分类
export const getCategories = () => {
  return request.get('/categories', {})
}

// 上传文章封面
export const uploadCoverImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/articles/upload-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
