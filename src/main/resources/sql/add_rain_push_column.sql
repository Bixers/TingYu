-- 雨丝订阅偏好字段
ALTER TABLE users
    ADD COLUMN rain_push_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否接收雨丝' AFTER avatar_url;
