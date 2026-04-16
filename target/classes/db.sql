-- 听雨眠舟数据库初始化脚本
-- 微信云托管 MySQL

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS tingyu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tingyu;

-- 诗词表
CREATE TABLE IF NOT EXISTS poems (
    id VARCHAR(64) PRIMARY KEY COMMENT '诗词ID',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    dynasty VARCHAR(50) NOT NULL COMMENT '朝代',
    author VARCHAR(100) NOT NULL COMMENT '作者',
    content TEXT NOT NULL COMMENT '正文内容（JSON格式）',
    annotation TEXT COMMENT '注释',
    appreciation TEXT COMMENT '赏析',
    translation TEXT COMMENT '译文',
    tags JSON COMMENT '标签（JSON数组）',
    source VARCHAR(100) COMMENT '数据来源',
    source_url VARCHAR(500) COMMENT '来源URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_dynasty (dynasty),
    INDEX idx_author (author),
    FULLTEXT INDEX idx_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='诗词表';

-- 作者表
CREATE TABLE IF NOT EXISTS authors (
    id VARCHAR(64) PRIMARY KEY COMMENT '作者ID',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    dynasty VARCHAR(50) NOT NULL COMMENT '朝代',
    description TEXT COMMENT '简介',
    birth_year INT COMMENT '出生年份',
    death_year INT COMMENT '逝世年份',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_dynasty (dynasty),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作者表';

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(64) PRIMARY KEY COMMENT '标签ID',
    name VARCHAR(50) NOT NULL COMMENT '标签名',
    description VARCHAR(255) COMMENT '描述',
    category VARCHAR(50) COMMENT '分类',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 用户收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(64) PRIMARY KEY COMMENT '收藏ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    poem_id VARCHAR(64) NOT NULL COMMENT '诗词ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_poem_id (poem_id),
    UNIQUE KEY uk_user_poem (user_id, poem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 每日推荐表
CREATE TABLE IF NOT EXISTS daily_poems (
    id VARCHAR(64) PRIMARY KEY COMMENT '记录ID',
    poem_id VARCHAR(64) NOT NULL COMMENT '诗词ID',
    date VARCHAR(10) NOT NULL COMMENT '日期（YYYY-MM-DD）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_date (date),
    UNIQUE KEY uk_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日推荐表';

-- 插入初始诗词数据
INSERT INTO poems (id, title, dynasty, author, content, translation, annotation, appreciation, tags) VALUES
('poem_001', '春晓', '唐', '孟浩然', 
 '["春眠不觉晓，", "处处闻啼鸟。", "夜来风雨声，", "花落知多少。"]', 
 '春天的夜晚睡得很香甜，不知不觉天就亮了。醒来时到处都能听到鸟儿的啼叫声。回想起昨天夜里的风雨声，不知道有多少花儿被打落了。',
 '①晓：天亮。②闻：听到。③啼鸟：鸟啼，鸟儿鸣叫。',
 '这首诗描写了春天早晨的景色，表达了诗人对春天的喜爱之情。全诗语言清新自然，意境优美，是描写春景的名篇。',
 '["春天", "写景", "田园"]'),

('poem_002', '静夜思', '唐', '李白', 
 '["床前明月光，", "疑是地上霜。", "举头望明月，", "低头思故乡。"]', 
 '明亮的月光洒在床前，好像地上铺了一层白霜。我抬头望着天上的明月，不由得低头思念起故乡来。',
 '①疑：怀疑。②举头：抬头。',
 '这首诗写的是在寂静的月夜思念家乡的感受。诗的前两句写景，后两句抒情，语言朴素而感情真挚，是千古传诵的思乡名篇。',
 '["思乡", "月亮", "抒情"]'),

('poem_003', '登鹳雀楼', '唐', '王之涣', 
 '["白日依山尽，", "黄河入海流。", "欲穷千里目，", "更上一层楼。"]', 
 '夕阳依傍着西山慢慢落下，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。',
 '①鹳雀楼：旧址在今山西永济县。②穷：尽，使达到极点。',
 '这首诗写诗人在登高望远中表现出来的不凡的胸襟抱负，反映了盛唐时期人们积极向上的进取精神。后两句富含哲理，成为千古名句。',
 '["哲理", "山水", "励志"]'),

('poem_004', '江雪', '唐', '柳宗元', 
 '["千山鸟飞绝，", "万径人踪灭。", "孤舟蓑笠翁，", "独钓寒江雪。"]', 
 '所有的山上，飞鸟的身影已经绝迹，所有的小路，人的踪迹也没有了。江面孤舟上，一位披戴着蓑笠的老翁，独自在大雪覆盖的寒冷江面上垂钓。',
 '①绝：无，没有。②万径：虚指，指千万条路。③蓑笠：蓑衣和斗笠。',
 '这首诗描绘了一幅寄兴高洁、寓意丰富的寒江独钓图。诗中"孤舟蓑笠翁"的形象，正是诗人清高孤傲、不愿与世俗同流合污的性格写照。',
 '["冬天", "写景", "孤独"]'),

('poem_005', '水调歌头', '宋', '苏轼', 
 '["明月几时有？把酒问青天。", "不知天上宫阙，今夕是何年。", "我欲乘风归去，又恐琼楼玉宇，", "高处不胜寒。", "起舞弄清影，何似在人间。", "转朱阁，低绮户，照无眠。", "不应有恨，何事长向别时圆？", "人有悲欢离合，月有阴晴圆缺，", "此事古难全。", "但愿人长久，千里共婵娟。"]', 
 '明月从什么时候才开始出现的？我端起酒杯遥问苍天。不知道在天上的宫殿，今天晚上是何年何月。我想要乘御清风回到天上，又恐怕在美玉砌成的楼宇，受不住高耸九天的寒冷。翩翩起舞玩赏着月下清影，哪像是在人间。月儿转过朱红色的楼阁，低低地挂在雕花的窗户上，照着没有睡意的人。明月不该对人们有什么怨恨吧，为什么偏在人们离别时才圆呢？人有悲欢离合的变迁，月有阴晴圆缺的转换，这种事自古来难以周全。只希望这世上所有人的亲人能平安健康，即便相隔千里，也能共享这美好的月光。',
 '①宫阙：宫殿。②归去：回到天上去。③琼楼玉宇：美玉砌成的楼宇。④婵娟：指月亮。',
 '这首词是中秋望月怀人之作，表达了对胞弟苏辙的无限思念。词人运用形象的描绘和浪漫主义的想象，紧紧围绕中秋之月展开描写、抒情和议论，从天上与人间、月与人、空间与时间这些相联系的范畴进行思考，把人世间的悲欢离合之情纳入对宇宙人生的哲理性追寻之中。',
 '["中秋", "月亮", "哲理", "豪放"]');

-- 插入初始标签数据
INSERT INTO tags (id, name, description, category) VALUES
('tag_001', '春天', '描写春天的诗词', '季节'),
('tag_002', '夏天', '描写夏天的诗词', '季节'),
('tag_003', '秋天', '描写秋天的诗词', '季节'),
('tag_004', '冬天', '描写冬天的诗词', '季节'),
('tag_005', '月亮', '与月亮相关的诗词', '意象'),
('tag_006', '山水', '描写山水的诗词', '题材'),
('tag_007', '思乡', '表达思乡之情的诗词', '情感'),
('tag_008', '爱情', '描写爱情的诗词', '情感'),
('tag_009', '哲理', '蕴含哲理的诗词', '题材'),
('tag_010', '写景', '描写景色的诗词', '题材'),
('tag_011', '抒情', '抒发情感的诗词', '体裁'),
('tag_012', '田园', '描写田园生活的诗词', '题材'),
('tag_013', '豪放', '豪放派诗词', '风格'),
('tag_014', '婉约', '婉约派诗词', '风格'),
('tag_015', '励志', '励志向上的诗词', '主题');
