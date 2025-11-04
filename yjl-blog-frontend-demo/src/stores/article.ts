import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveArticle } from '@/apis/articles'
import { getCategories } from '@/apis/articles'
import type { Article } from '@/models/Article'

export const useArticleStore = defineStore('article', () => {
  const title = ref('')
  const content = ref('')
  const tags = ref<string[]>([])
  const category = ref('')
  const categoryId = ref<number>()
  const description = ref('')
  const coverUrl = ref('')
  const status = ref(0) // 0: 草稿, 1: 发布
  const views = ref(0)
  const likeCount = ref(0)
  const commentCount = ref(0)
  const categories = ref<Array<{ id: number; name: string }>>([])

  // 生成摘要
  const generateDescription = () => {
    const plainText = content.value.replace(/<[^>]*>/g, '')
    description.value = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText
  }

  const validateArticle = () => {
    if (!title.value.trim()) throw new Error('请输入文章标题')
    if (!content.value.trim()) throw new Error('请输入文章内容')
    if (content.value.length < 50) throw new Error('内容至少需要50个字符')
    if (!category.value && !categoryId.value) throw new Error('请选择文章分类')
  }

  // 构建文章数据对象
  const buildArticleData = (publish: boolean = false) => {
    // 生成摘要
    if (!description.value) {
      generateDescription()
    }

    return {
      title: title.value,
      content: content.value,
      tags: tags.value,
      category: category.value,
      categoryId: categoryId.value,
      description: description.value,
      coverUrl: coverUrl.value,
      status: publish ? 1 : status.value,
      views: views.value,
      likeCount: likeCount.value,
      commentCount: commentCount.value,
    }
  }

  const saveArticles = async (publish: boolean = false) => {
    validateArticle()
    const articleData = buildArticleData(publish)
    return await saveArticle(articleData)
  }

  // 更新文章
  const updateArticle = async (articleId: string, publish: boolean = false) => {
    validateArticle()
    const articleData = {
      ...buildArticleData(publish),
      id: parseInt(articleId), // 添加文章ID，用于标识更新操作
    }
    return await saveArticle(articleData)
  }

  // 加载分类列表 - 简化版本用于调试
  const loadCategories = async () => {
    try {
      if (typeof getCategories !== 'function') {
        console.error('getCategories不是一个函数，检查导入')
        return
      }

      const response = await getCategories()

      // 确保有数据返回
      if (!response) {
        console.error('API返回为空')
        categories.value = []
        return
      }

      // 适配不同的数据格式
      let categoryData = []
      if (response.data && response.data.categories && response.data.categories.data) {
        categoryData = response.data.categories.data
      } else if (response.data && response.data.data) {
        categoryData = response.data.data
      } else if (Array.isArray(response.data)) {
        categoryData = response.data
      } else if (Array.isArray(response)) {
        categoryData = response
      } else {
        console.error('未知的分类数据格式:', response)
        categoryData = []
      }

      categories.value = categoryData
    } catch (error) {
      console.error('加载分类失败:', error)
      categories.value = []
      throw error // 重新抛出错误，让调用方知道
    }
  }

  // 重置文章数据
  const resetArticle = () => {
    title.value = ''
    content.value = ''
    tags.value = []
    category.value = ''
    categoryId.value = undefined
    description.value = ''
    coverUrl.value = ''
    status.value = 0
    views.value = 0
    likeCount.value = 0
    commentCount.value = 0
  }

  // 设置文章内容
  const setArticle = (article: Article) => {
    title.value = article.title || ''
    content.value = article.content || ''
    tags.value = article.tags || []
    category.value = article.categoryName || ''
    categoryId.value = article.categoryId
    description.value = article.description || ''
    coverUrl.value = article.coverUrl || ''
    status.value = article.status || 0
    views.value = article.views || 0
    likeCount.value = article.likeCount || 0
    commentCount.value = article.commentCount || 0
  }

  const changeArticle = () => {
    title.value = '修改后的标题'
    content.value = '修改后的内容'
  }

  return {
    title,
    content,
    tags,
    category,
    categoryId,
    description,
    coverUrl,
    status,
    views,
    likeCount,
    commentCount,
    categories,
    saveArticles,
    updateArticle,
    changeArticle,
    resetArticle,
    setArticle,
    loadCategories,
    generateDescription,
  }
})
