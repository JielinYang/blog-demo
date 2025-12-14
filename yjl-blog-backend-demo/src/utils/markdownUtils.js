import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 读取Markdown文件内容
 * @param {string} filePath - 文件路径（相对于项目根目录或绝对路径）
 * @returns {Promise<string>} - 文件内容
 */
export const readMarkdownFile = async (filePath) => {
  try {
    // 如果是相对路径，转换为绝对路径
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    
    // 读取文件内容
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('读取Markdown文件失败:', error);
    throw error;
  }
};

/**
 * 从Markdown内容中提取摘要
 * @param {string} content - Markdown内容
 * @param {number} maxLength - 最大长度，默认200字符
 * @returns {string} - 提取的摘要
 */
export const extractDescription = (content, maxLength = 200) => {
  if (!content) return '';
  
  // 移除Front Matter（如果存在）
  let cleanContent = content.replace(/^---[\s\S]*?---\n/m, '');
  
  // 移除Markdown标记
  cleanContent = cleanContent
    .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接，保留文本
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/>\s+/g, '') // 移除引用标记
    .replace(/[-*+]\s+/g, '') // 移除列表标记
    .replace(/\n+/g, ' ') // 将换行替换为空格
    .trim();
  
  // 截取指定长度
  if (cleanContent.length > maxLength) {
    return cleanContent.substring(0, maxLength) + '...';
  }
  
  return cleanContent;
};

/**
 * 解析Markdown Front Matter
 * @param {string} content - Markdown内容
 * @returns {Object} - 解析后的元数据对象
 */
export const parseFrontMatter = (content) => {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return {};
  }
  
  const frontMatterText = match[1];
  const metadata = {};
  
  // 简单的YAML解析（仅支持基本的key: value格式）
  const lines = frontMatterText.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // 处理数组（简单的逗号分隔）
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      }
      
      metadata[key] = value;
    }
  }
  
  return metadata;
};

/**
 * 生成Markdown文件存储路径
 * @param {number|string} id - 文章ID或时间戳
 * @returns {string} - 文件路径
 */
export const generateFilePath = (id = Date.now()) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // 创建目录结构: uploads/articles/YYYY/MM/
  const dir = path.join('uploads', 'articles', String(year), month);
  
  // 确保目录存在
  const absoluteDir = path.join(process.cwd(), dir);
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }
  
  // 生成文件名: article-{timestamp}.md
  const filename = `article-${id}.md`;
  
  // 返回相对路径
  return `/${dir.replace(/\\/g, '/')}/${filename}`;
};

/**
 * 保存Markdown内容到文件
 * @param {string} content - Markdown内容
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 是否保存成功
 */
export const saveMarkdownFile = async (content, filePath) => {
  try {
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    // 确保目录存在
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(absolutePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('保存Markdown文件失败:', error);
    throw error;
  }
};

/**
 * 删除Markdown文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 是否删除成功
 */
export const deleteMarkdownFile = async (filePath) => {
  try {
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), filePath);
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除Markdown文件失败:', error);
    throw error;
  }
};
