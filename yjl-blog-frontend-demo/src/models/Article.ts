// src/models/Article.ts
interface IArticle {
  id: number
  title: string
  content: string
  authorId: number
  categoryId?: number
  views: number
  likeCount: number
  commentCount: number
  status: number
  createTime: string
  updateTime: string
}

export class Article implements IArticle {
  // 类属性（严格类型声明）
  public id: number
  public title: string
  public content: string
  public authorId: number
  public categoryId?: number
  public views: number
  public likeCount: number
  public commentCount: number
  public status: number
  public createTime: string
  public updateTime: string

  // 构造函数（支持对象初始化）
  constructor(data: Partial<IArticle>) {
    this.id = data.id || 0
    this.title = data.title || ''
    this.content = data.content || ''
    this.authorId = data.authorId || 0
    this.categoryId = data.categoryId
    this.views = data.views || 0
    this.likeCount = data.likeCount || 0
    this.commentCount = data.commentCount || 0
    this.status = data.status || 0
    this.createTime = data.createTime || new Date().toDateString()
    this.updateTime = data.updateTime || new Date().toDateString()
  }

  // 实例方法
  public validate(): boolean {
    return this.title.length > 0 && this.content.length > 5
  }
}
