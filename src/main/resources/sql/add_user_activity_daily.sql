-- 用户阅读足迹统计

CREATE TABLE IF NOT EXISTS user_activity_daily (
    id VARCHAR(64) PRIMARY KEY COMMENT '统计ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    activity_date DATE NOT NULL COMMENT '统计日期',
    poem_views INT NOT NULL DEFAULT 0 COMMENT '诗词浏览次数',
    search_count INT NOT NULL DEFAULT 0 COMMENT '搜索次数',
    excerpt_count INT NOT NULL DEFAULT 0 COMMENT '摘录次数',
    favorite_count INT NOT NULL DEFAULT 0 COMMENT '收藏次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user_date (user_id, activity_date),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户阅读足迹统计';
