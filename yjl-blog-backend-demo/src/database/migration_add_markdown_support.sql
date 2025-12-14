-- Migration script to add Markdown support to articles table
-- This script adds content_path, author_id, and tags fields to the existing articles table

-- Add content_path field for Markdown file storage
ALTER TABLE articles ADD COLUMN content_path VARCHAR(500) NULL COMMENT 'Markdown文件路径' AFTER content;

-- Add author_id field
ALTER TABLE articles ADD COLUMN author_id INT NULL COMMENT '作者ID' AFTER content_path;

-- Add tags field as JSON
ALTER TABLE articles ADD COLUMN tags JSON NULL COMMENT '标签数组' AFTER category_id;

-- Make content field nullable for backward compatibility
ALTER TABLE articles MODIFY COLUMN content LONGTEXT NULL COMMENT '文章内容（支持富文本/HTML，Markdown文章此字段为空）';

-- Update description field to support longer text
ALTER TABLE articles MODIFY COLUMN description VARCHAR(500) NULL COMMENT '文章摘要';

-- Add index on author_id
CREATE INDEX idx_author ON articles (author_id);

-- Add ON UPDATE CURRENT_TIMESTAMP to update_time if not exists
ALTER TABLE articles MODIFY COLUMN update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;