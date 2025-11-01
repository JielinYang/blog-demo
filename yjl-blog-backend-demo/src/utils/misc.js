// yjl-blog-backend-demo/src/utils/misc.js

/**
 * 将日期时间格式化为 YYYY-MM-DD HH:mm:ss 格式
 * @param {string|number|Date} dateTime - 日期时间字符串、时间戳或 Date 对象
 * @returns {string|null} - 格式化后的日期时间字符串或 null（如果输入无效）
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  return date.toISOString().slice(0, 19).replace("T", " ");
}
