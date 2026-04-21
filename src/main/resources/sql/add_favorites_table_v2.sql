-- 收藏功能表结构升级
-- 兼容全文收藏与句子收藏

ALTER TABLE favorites
    ADD COLUMN favorite_type VARCHAR(20) NOT NULL DEFAULT 'FULL' COMMENT '收藏类型：FULL=全文，SENTENCE=句子' AFTER user_id,
    ADD COLUMN target_key VARCHAR(255) NOT NULL DEFAULT '' COMMENT '收藏唯一键' AFTER poem_id,
    ADD COLUMN sentence_index INT DEFAULT NULL COMMENT '句子序号' AFTER target_key,
    ADD COLUMN sentence_text TEXT COMMENT '句子内容' AFTER sentence_index,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER created_at;

UPDATE favorites
SET favorite_type = 'FULL',
    target_key = poem_id
WHERE favorite_type IS NULL OR favorite_type = '';

ALTER TABLE favorites
    DROP INDEX uk_user_poem,
    ADD UNIQUE KEY uk_user_type_target (user_id, favorite_type, target_key),
    ADD INDEX idx_favorite_type (favorite_type);
