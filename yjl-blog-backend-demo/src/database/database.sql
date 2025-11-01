create table articles
(
    id            int auto_increment comment '主键（自增）'
        primary key,
    title         varchar(255)                       not null comment '文章标题',
    content       longtext                           not null comment '文章内容（支持富文本）',
    category_id   int                                null comment '分类ID（关联分类表）',
    views         bigint   default 0                 not null comment '访问次数',
    like_count    bigint   default 0                 not null comment '点赞量',
    comment_count int      default 0                 not null comment '评论数',
    status        tinyint  default 0                 not null comment '状态：0-草稿，1-已发布，2-已下架',
    cover_url     varchar(255)                       null comment '封面图URL',
    description   varchar(255)                       null comment '文章摘要',
    is_top        tinyint  default 0                 not null comment '是否置顶：0-否，1-是',
    create_time   datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time   datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间'
)
    comment '文章主表' collate = utf8mb4_bin;

create index idx_category
    on articles (category_id);

create index idx_status
    on articles (status);