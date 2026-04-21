-- 诗舟漂流表结构

CREATE TABLE IF NOT EXISTS boat_messages (
    id VARCHAR(64) PRIMARY KEY COMMENT '诗笺ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    content VARCHAR(500) NOT NULL COMMENT '诗句内容',
    signature VARCHAR(100) NOT NULL DEFAULT '听雨客' COMMENT '匿名署名',
    parent_message_id VARCHAR(64) DEFAULT NULL COMMENT '回复的原诗笺ID',
    reply_count INT NOT NULL DEFAULT 0 COMMENT '回复数量',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_parent_message_id (parent_message_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='诗舟诗笺表';

CREATE TABLE IF NOT EXISTS boat_matches (
    id VARCHAR(64) PRIMARY KEY COMMENT '匹配ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    message_id VARCHAR(64) NOT NULL COMMENT '诗笺ID',
    match_type VARCHAR(20) NOT NULL COMMENT '匹配类型：RECEIVED=收取，BOOKMARKED=收藏，REPLIED=回复',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_message_type (user_id, message_id, match_type),
    INDEX idx_user_id (user_id),
    INDEX idx_message_id (message_id),
    INDEX idx_match_type (match_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='诗舟匹配记录表';
