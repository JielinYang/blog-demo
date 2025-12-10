-- auto-generated definition
create table articles
(
    id            int auto_increment comment '主键（自增）'
        primary key,
    title         varchar(255)                        not null comment '文章标题',
    content       longtext                            not null comment '文章内容（支持富文本）',
    category_id   int                                 null comment '分类ID（关联分类表）',
    views         bigint    default 0                 not null comment '访问次数',
    like_count    bigint    default 0                 not null comment '点赞量',
    comment_count int       default 0                 not null comment '评论数',
    status        tinyint   default 0                 not null comment '状态：0-草稿，1-已发布，2-已下架',
    cover_url     varchar(255)                        null comment '封面图URL',
    description   varchar(255)                        null comment '文章摘要',
    is_top        tinyint   default 0                 not null comment '是否置顶：0-否，1-是',
    create_time   datetime  default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time   timestamp default CURRENT_TIMESTAMP null
)
    comment '文章主表' collate = utf8mb4_bin;

create index idx_category
    on articles (category_id);

create index idx_status
    on articles (status);

INSERT INTO articles (title, content, category_id, views, like_count, comment_count, status, cover_url, description, is_top) VALUES ('文章初始化测试1', 'Terminatio quo quos color comedo despecto tabula. Bos conicio conor cui audentia creta textus voluptatem speciosus combibo. Cohaero bene concedo decens coniuratio repellat vulnero. Voluptates vitae verto defetiscor aggero antiquus clam aegrotatio demens. Voluntarius spectaculum vos vacuus cetera textilis charisma trepide.', 2, 3310, 3587, 68, 0, 'https://loremflickr.com/800/400?lock=3166031086821370', 'Terminatio quo quos color comedo despecto tabula. Bos conicio conor cui audentia creta textus voluptatem speciosus combibo. Cohaero bene concedo decens coniuratio repellat vulnero. Voluptates vitae verto defetiscor aggero antiquus clam aegrotatio dem', 1);
INSERT INTO articles (title, content, category_id, views, like_count, comment_count, status, cover_url, description, is_top) VALUES ('文章初始化测试2', 'Derelinquo aestas vespillo mollitia conculco animadverto. Cado vetus surgo numquam. Volup testimonium tergo quisquam derideo tabula. Antiquus damnatio condico undique cohors adduco spero vae. Convoco abstergo vulgivagus surculus dapifer civis caritas theatrum.', 1, 6517, 3780, 155, 1, 'https://picsum.photos/seed/NChsoDty02/800/400', 'Derelinquo aestas vespillo mollitia conculco animadverto. Cado vetus surgo numquam. Volup testimonium tergo quisquam derideo tabula. Antiquus damnatio condico undique cohors adduco spero vae. Convoco abstergo vulgivagus surculus dapifer civis caritas', 0);
INSERT INTO articles (title, content, category_id, views, like_count, comment_count, status, cover_url, description, is_top) VALUES ('文章初始化测试3', '<p>技术分享333333 Decimus decerno correptius summa bis totidem. Certe caterva expedita vestrum. Cohaero carcer fuga confugo. Cuius solio deserunt tero vomito fuga quibusdam cribro. Cibo vos curatio patrocinor neque minima soluta ulciscor angelus.</p>', 1, 0, 0, 0, 1, 'https://loremflickr.com/800/400?lock=6852475741619517', 'Decimus decerno correptius summa bis totidem. Certe caterva expedita vestrum. Cohaero carcer fuga confugo. Cuius solio deserunt tero vomito fuga quibusdam cribro. Cibo vos curatio patrocinor neque minima soluta ulciscor angelus.', 1);


-- auto-generated definition
create table categories
(
    id            int auto_increment
        primary key,
    name          varchar(100)                        not null comment '分类名称',
    description   text                                null comment '分类描述',
    article_count int       default 0                 null comment '文章数量',
    create_time   timestamp default CURRENT_TIMESTAMP null,
    update_time   timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    constraint name
        unique (name)
)
    comment '文章分类表' collate = utf8mb4_unicode_ci;

create index idx_article_count
    on categories (article_count);

create index idx_name
    on categories (name);

INSERT INTO categories (name, description) VALUES ('技术分享', '分享技术文章、编程经验、开发心得等');
INSERT INTO categories (name, description) VALUES ('生活随笔', '记录日常生活、感悟、思考等');
INSERT INTO categories (name, description) VALUES ('学习笔记', '学习过程中的笔记、总结、心得体会');
INSERT INTO categories (name, description) VALUES ('项目总结', '项目开发过程中的经验总结、技术方案等');


-- Life Memory Fragments Table
CREATE TABLE `life_fragments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `content` text COMMENT 'Text content of the memory',
  `image_url` varchar(255) DEFAULT NULL COMMENT 'URL of the uploaded image',
  `mood` varchar(50) DEFAULT NULL COMMENT 'Mood (e.g., Happy, Sad, Calm, Excited)',
  `weather` varchar(50) DEFAULT NULL COMMENT 'Weather (e.g., Sunny, Rainy, Cloudy, Snowy)',
  `record_time` datetime NOT NULL COMMENT 'Time of the memory',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Life Memory Fragments';
