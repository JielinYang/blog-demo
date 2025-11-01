import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// 创建DOMPurify实例
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// 配置允许的HTML标签和属性
const allowedTags = [
  "p", "br", "strong", "em", "u", "strike", "del", "ins",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "img",
  "table", "thead", "tbody", "tr", "td", "th",
  "div", "span", "section", "article", "header", "footer",
  "b", "i", "mark", "small", "sub", "sup"
];

const allowedAttributes = {
  "a": ["href", "title", "target", "rel"],
  "img": ["src", "alt", "title", "width", "height"],
  "*": ["class", "id", "style"]
};

// 配置允许的URL协议
const allowedProtocols = ["http", "https", "mailto", "tel"];

// 自定义配置
purify.setConfig({
  ALLOWED_TAGS: allowedTags,
  ALLOWED_ATTR: allowedAttributes,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/\/)/i, // 允许相对协议
  ADD_TAGS: ["img"], // 确保img标签被允许
  ADD_ATTR: ["src"], // 确保src属性被允许
});

/**
 * 清理HTML内容，移除潜在的危险元素和脚本
 * @param {string} html - 需要清理的HTML内容
 * @param {Object} options - 额外配置选项
 * @returns {string} - 清理后的安全HTML内容
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // 基础清理
    let cleanHTML = purify.sanitize(html, {
      ...purify.config,
      ...options
    });

    // 额外的安全检查
    cleanHTML = cleanHTML
      .replace(/javascript:/gi, "") // 移除javascript:协议
      .replace(/on\w+\s*=/gi, "") // 移除事件处理器
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 移除script标签
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // 移除iframe标签
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "") // 移除object标签
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "") // 移除embed标签
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, ""); // 移除form标签

    // 修复图片URL - 确保相对路径和绝对路径都能正确显示
    cleanHTML = cleanHTML.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
      // 如果src是相对路径或MinIO路径，保留原样
      if (src.startsWith('/') || src.startsWith('http://192.168.101.128') || src.includes('blog-images')) {
        return match;
      }
      // 否则移除不安全的图片
      return '';
    });

    return cleanHTML.trim();
  } catch (error) {
    console.error("HTML清理失败:", error);
    return "";
  }
}

/**
 * 清理纯文本内容，移除HTML标签
 * @param {string} text - 需要清理的文本
 * @returns {string} - 清理后的纯文本
 */
export function sanitizeText(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .replace(/<[^>]*>/g, "") // 移除所有HTML标签
    .replace(/&lt;/g, "<") // 转换HTML实体
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 验证URL是否安全
 * @param {string} url - 需要验证的URL
 * @returns {boolean} - URL是否安全
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return allowedProtocols.includes(parsedUrl.protocol.replace(":", ""));
  } catch (error) {
    // 如果URL解析失败，尝试添加协议再验证
    try {
      const parsedUrlWithProtocol = new URL(`https://${url}`);
      return allowedProtocols.includes(parsedUrlWithProtocol.protocol.replace(":", ""));
    } catch (innerError) {
      return false;
    }
  }
}

/**
 * 清理文章内容（包括标题、摘要、内容）
 * @param {Object} article - 文章对象
 * @returns {Object} - 清理后的文章对象
 */
export function sanitizeArticle(article) {
  if (!article || typeof article !== "object") {
    return {};
  }

  const sanitized = { ...article };

  // 清理标题
  if (sanitized.title) {
    sanitized.title = sanitizeText(sanitized.title);
  }

  // 清理摘要
  if (sanitized.summary) {
    sanitized.summary = sanitizeText(sanitized.summary);
  }

  // 清理内容
  if (sanitized.content) {
    sanitized.content = sanitizeHTML(sanitized.content);
  }

  // 清理标签
  if (sanitized.tags) {
    if (Array.isArray(sanitized.tags)) {
      sanitized.tags = sanitized.tags.map(tag => sanitizeText(tag));
    } else if (typeof sanitized.tags === "string") {
      sanitized.tags = sanitizeText(sanitized.tags);
    }
  }

  // 验证封面图片URL
  if (sanitized.cover_image && !isSafeUrl(sanitized.cover_image)) {
    sanitized.cover_image = "";
  }

  return sanitized;
}

/**
 * 清理评论内容
 * @param {Object} comment - 评论对象
 * @returns {Object} - 清理后的评论对象
 */
export function sanitizeComment(comment) {
  if (!comment || typeof comment !== "object") {
    return {};
  }

  const sanitized = { ...comment };

  // 清理评论者名称
  if (sanitized.author) {
    sanitized.author = sanitizeText(sanitized.author);
  }

  // 清理评论内容
  if (sanitized.content) {
    sanitized.content = sanitizeHTML(sanitized.content, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "pre"],
      ALLOWED_ATTR: {}
    });
  }

  // 验证邮箱
  if (sanitized.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized.email)) {
      sanitized.email = "";
    }
  }

  // 验证网站
  if (sanitized.website && !isSafeUrl(sanitized.website)) {
    sanitized.website = "";
  }

  return sanitized;
}