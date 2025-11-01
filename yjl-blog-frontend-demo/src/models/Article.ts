// src/models/Article.ts
interface IArticle {
  id: number
  title: string
  content: string
  authorId: number
  authorName?: string
  categoryId?: number
  categoryName?: string
  tags?: string[]
  summary?: string
  coverImage?: string
  views: number
  likeCount: number
  commentCount: number
  status: number // 0: 草稿, 1: 已发布, 2: 已下线
  isTop?: boolean
  createTime: string
  updateTime: string
}

export class Article implements IArticle {
  // 类属性（严格类型声明）
  public id: number
  public title: string
  public content: string
  public authorId: number
  public authorName?: string
  public categoryId?: number
  public categoryName?: string
  public tags?: string[]
  public summary?: string
  public coverImage?: string
  public views: number
  public likeCount: number
  public commentCount: number
  public status: number
  public isTop?: boolean
  public createTime: string
  public updateTime: string

  // 构造函数（支持对象初始化）
  constructor(data: Partial<IArticle>) {
    this.id = data.id || 0
    this.title = data.title || ''
    this.content = data.content || ''
    this.authorId = data.authorId || 0
    this.authorName = data.authorName || ''
    this.categoryId = data.categoryId
    this.categoryName = data.categoryName || ''
    this.tags = data.tags || []
    this.summary = data.summary || ''
    this.coverImage = data.coverImage || ''
    this.views = data.views || 0
    this.likeCount = data.likeCount || 0
    this.commentCount = data.commentCount || 0
    this.status = data.status || 0
    this.isTop = data.isTop || false
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
  }

  // 实例方法
  public validate(): boolean {
    return this.title.length > 0 && this.content.length > 5
  }

  // 生成文章摘要
  public generateSummary(maxLength: number = 200): string {
    if (this.summary) return this.summary
    
    // 从内容中提取纯文本
    const plainText = this.content.replace(/<[^>]*>/g, '')
    if (plainText.length <= maxLength) return plainText
    
    return plainText.substring(0, maxLength) + '...'
  }

  // 获取文章状态文本
  public getStatusText(): string {
    const statusMap = {
      0: '草稿',
      1: '已发布',
      2: '已下线'
    }
    return statusMap[this.status as keyof typeof statusMap] || '未知'
  }
}
