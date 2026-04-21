CREATE TABLE IF NOT EXISTS excerpts (
    id VARCHAR(64) PRIMARY KEY COMMENT '摘录ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    poem_id VARCHAR(64) NOT NULL COMMENT '诗词ID',
    sentence_index INT NOT NULL COMMENT '句子序号',
    sentence_text TEXT NOT NULL COMMENT '摘录句子',
    note TEXT COMMENT '私人批注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_poem_id (poem_id),
    INDEX idx_created_at (created_at),
    UNIQUE KEY uk_user_poem_sentence (user_id, poem_id, sentence_index, sentence_text(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摘录本';
