import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveArticle } from '@/apis/articles'
import { getCategories } from '@/apis/articles'

export const useArticleStore = defineStore('article', () => {
  const title = ref('测试文章标题')
  const content = ref('测试文章内容')
  const tags = ref<string[]>([])
  const category = ref('')
  const categoryId = ref<number>()
  const summary = ref('')
  const coverImage = ref('')
  const status = ref(0) // 0: 草稿, 1: 发布
  const categories = ref<Array<{id: number, name: string}>>([])

  // 生成摘要
  const generateSummary = () => {
    const plainText = content.value.replace(/<[^>]*>/g, '')
    summary.value = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText
  }

  const validateArticle = () => {
    if (!title.value.trim()) throw new Error('请输入文章标题')
    if (!content.value.trim()) throw new Error('请输入文章内容')
    if (content.value.length < 50) throw new Error('内容至少需要50个字符')
    if (!category.value && !categoryId.value) throw new Error('请选择文章分类')
  }

  const saveArticles = async (publish: boolean = false) => {
    validateArticle()
    
    // 生成摘要
    if (!summary.value) {
      generateSummary()
    }
    
    const articleData = {
      title: title.value,
      content: content.value,
      tags: tags.value,
      category: category.value,
      categoryId: categoryId.value,
      summary: summary.value,
      coverImage: coverImage.value,
      status: publish ? 1 : status.value
    }
    
    return await saveArticle(articleData)
  }

  // 加载分类列表 - 简化版本用于调试
  const loadCategories = async () => {
    console.log('开始加载分类列表...')
    try {
      console.log('getCategories函数:', typeof getCategories)
      if (typeof getCategories !== 'function') {
        console.error('getCategories不是一个函数，检查导入')
        return
      }
      
      const response = await getCategories()
      console.log('分类API返回数据:', response)
      
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
      console.log('分类加载完成，数量:', categories.value.length)
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
    summary.value = ''
    coverImage.value = ''
    status.value = 0
  }

  // 设置文章内容
  const setArticle = (article: any) => {
    title.value = article.title || ''
    content.value = article.content || ''
    tags.value = article.tags || []
    category.value = article.category || ''
    categoryId.value = article.categoryId
    summary.value = article.summary || ''
    coverImage.value = article.coverImage || ''
    status.value = article.status || 0
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
    summary, 
    coverImage,
    status,
    categories,
    saveArticles, 
    changeArticle,
    resetArticle,
    setArticle,
    loadCategories,
    generateSummary
  }
})
