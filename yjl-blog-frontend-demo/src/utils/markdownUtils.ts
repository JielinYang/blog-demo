import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import matter from 'gray-matter'
import taskLists from 'markdown-it-task-lists'

// 配置 markdown-it 实例
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动转换 URL 为链接
  typographer: true, // 启用智能引号和其他排版优化
  highlight: function (str, lang) {
    // 代码高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        )
      } catch (__) {
        // 忽略错误
      }
    } else {
      // 自动检测语言
      try {
        return '<pre class="hljs"><code>' + hljs.highlightAuto(str).value + '</code></pre>'
      } catch (__) {
        // 忽略错误
      }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  },
}).use(taskLists, { enabled: true, label: true })

/**
 * 解析 Markdown Front Matter 元数据
 * @param content Markdown 完整内容(包含 Front Matter)
 * @returns { data: 元数据对象, content: 纯 Markdown 内容 }
 */
export function parseFrontMatter(content: string): {
  data: {
    title?: string
    tags?: string[]
    category?: string
    categoryId?: number
    description?: string
    coverUrl?: string
    [key: string]: any
  }
  content: string
} {
  try {
    const result = matter(content)
    return {
      data: result.data,
      content: result.content,
    }
  } catch (error) {
    console.error('Front Matter 解析失败:', error)
    return {
      data: {},
      content: content,
    }
  }
}

/**
 * 渲染 Markdown 为 HTML
 * @param markdown Markdown 文本
 * @returns HTML 字符串
 */
export function parseMarkdown(markdown: string): string {
  try {
    return md.render(markdown)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return '<p>渲染失败</p>'
  }
}

/**
 * 提取文章目录结构 (Table of Contents)
 * @param markdown Markdown 文本
 * @returns 目录树数组
 */
export interface TocItem {
  level: number // 标题级别 1-6
  text: string // 标题文本
  anchor: string // 锚点 ID
  children?: TocItem[] // 子标题
}

export function extractTOC(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TocItem[] = []
  const stack: TocItem[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const anchor = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const item: TocItem = { level, text, anchor }

    // 构建层级结构
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      toc.push(item)
    } else {
      const parent = stack[stack.length - 1]
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(item)
    }

    stack.push(item)
  }

  return toc
}

/**
 * 从 Markdown 中提取纯文本(用于文章预览)
 * @param markdown Markdown 文本
 * @param maxLength 最大长度
 * @returns 纯文本字符串
 */
export function extractPlainText(markdown: string, maxLength: number = 200): string {
  // 移除 Front Matter
  const { content } = parseFrontMatter(markdown)

  // 移除 Markdown 标记
  const plainText = content
    .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接,保留文本
    .replace(/!\[.*?\]\(.+?\)/g, '') // 移除图片
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/>\s+/g, '') // 移除引用标记
    .replace(/[-*+]\s+/g, '') // 移除列表标记
    .replace(/~~(.+?)~~/g, '$1') // 移除删除线
    .replace(/__(.+?)__/g, '$1') // 移除下划线
    .replace(/_(.+?)_/g, '$1') // 移除斜体下划线
    .replace(/\[\s\]\s*/g, '') // 移除未勾选的复选框
    .replace(/\[x\]\s*/g, '') // 移除已勾选的复选框
    .replace(/\[X\]\s*/g, '') // 移除已勾选的复选框(大写)
    .replace(/\n+/g, ' ') // 换行转空格
    .trim()

  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength) + '...'
  }

  return plainText
}

/**
 * 为 Markdown 渲染的 HTML 添加锚点 ID
 * @param html 渲染后的 HTML
 * @returns 添加了锚点的 HTML
 */
export function addHeadingAnchors(html: string): string {
  return html.replace(/<h([1-6])>(.+?)<\/h\1>/g, (match, level, text) => {
    const anchor = text
      .toLowerCase()
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `<h${level} id="${anchor}">${text}</h${level}>`
  })
}
