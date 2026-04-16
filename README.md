# 听雨眠舟 (TingYu)

> 春水碧于天，画船听雨眠

古典诗词微信小程序，提供诗词浏览、搜索、卡片分享、拼音注音等功能。基于 Spring Boot + 微信云托管 + MySQL 构建。

## 功能特性

### 小程序端
- **首页** - 每日推荐 / 随机切换诗词卡片
- **发现** - 朝代筛选、标签筛选、关键词搜索，分页浏览
- **详情** - 注释 / 赏析 / 译文 Tab 切换，作者介绍，标签跳转，沉浸阅读模式
- **拼音** - 长按诗句/标题/作者显示带声调拼音，支持复制
- **卡片分享** - 5款模板（素纸/墨夜/竹青/淡金/烟雨），保存相册或分享好友
- **自适应卡片** - 长诗自动扩展卡片高度

### 后端服务
- **诗词爬虫** - 自动从 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 和 [ChinesePoetryLibrary](https://github.com/byj233/ChinesePoetryLibrary) 导入诗词数据
- **富化数据** - 自动匹配并补充译文、赏析、注释（词义对照）
- **定时任务** - 每周一凌晨自动导入新数据，启动时异步增量导入
- **智能标签** - 基于关键词自动推断诗词标签（季节/意象/题材/情感等）
- **拼音服务** - pinyin4j 中文转拼音（含声调）

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Spring Boot 2.5.5 / JDK 8 / MyBatis |
| 数据库 | MySQL (UTF8MB4) |
| 前端 | 微信小程序原生框架 (WXML/WXSS/JS) |
| 部署 | Docker 多阶段构建 / 微信云托管 |
| 数据源 | chinese-poetry, ChinesePoetryLibrary (MPL-2.0) |

## 项目结构

```
.
├── Dockerfile                          Docker 多阶段构建
├── pom.xml                             Maven 配置
└── src/main
    ├── java/com/tencent/wxcloudrun
    │   ├── WxCloudRunApplication.java  启动入口 (@EnableAsync @EnableScheduling)
    │   ├── controller/
    │   │   ├── PoemController.java     诗词 API (列表/详情/搜索/随机/每日)
    │   │   ├── AuthorController.java   作者 API
    │   │   ├── TagController.java      标签 API
    │   │   ├── MetaController.java     朝代/作者统计 API
    │   │   ├── AdminController.java    管理接口 (触发导入)
    │   │   ├── ToolController.java     工具 API (拼音转换)
    │   │   └── IndexController.java    健康检查
    │   ├── service/
    │   │   ├── PoemService.java        诗词业务逻辑
    │   │   ├── PoemCrawlerService.java 爬虫 + 定时/启动导入
    │   │   ├── PinyinService.java      拼音转换
    │   │   ├── AuthorService.java      作者查询
    │   │   ├── TagService.java         标签查询
    │   │   └── MetaService.java        统计查询
    │   ├── dao/                        MyBatis Mapper 接口
    │   ├── model/                      实体类 (Poem, Author, Tag, DailyPoem)
    │   └── dto/                        DTO (ApiResponse, PageResult, PinyinResult)
    └── resources/
        ├── application.yml             数据库/端口配置
        ├── db.sql                      建表 + 初始数据
        ├── mapper/                     MyBatis XML 映射
        └── static/miniprogram/         微信小程序前端代码
            ├── app.js / app.json       小程序入口配置
            ├── utils/api.js            统一 API 请求封装
            └── pages/
                ├── index/              首页 (每日诗词卡片)
                ├── detail/             详情页 (注释/赏析/译文/拼音)
                ├── discover/           发现页 (搜索/筛选/列表)
                └── share/              卡片分享页 (Canvas 绘制)
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/poems/daily` | 今日推荐诗词 |
| GET | `/api/poems/random` | 随机一首 |
| GET | `/api/poems/{id}` | 诗词详情 |
| GET | `/api/poems/list` | 分页列表 (keyword/dynasty/tag) |
| POST | `/api/poems/search` | 搜索诗词 |
| GET | `/api/tags` | 全部标签 |
| GET | `/api/tags/grouped` | 按分类分组的标签 |
| GET | `/api/authors/by-name` | 按名称查作者 |
| GET | `/api/meta/dynasties` | 朝代统计 |
| GET | `/api/meta/authors` | 作者统计 |
| POST | `/api/tools/pinyin` | 中文转拼音 |
| POST | `/api/admin/import-poems` | 触发诗词导入 |

## 部署

### 微信云托管部署

1. 在微信云托管控制台创建服务
2. 关联 GitHub 仓库，自动构建部署
3. 配置环境变量：
   - `MYSQL_ADDRESS` - 数据库地址 (host:port)
   - `MYSQL_USERNAME` - 数据库用户名
   - `MYSQL_PASSWORD` - 数据库密码

### 本地开发

```bash
# 确保本地 MySQL 已创建 tingyu 数据库并执行 db.sql
mvn spring-boot:run
```

## 数据源

| 来源 | 内容 | 许可 |
|------|------|------|
| [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) | 5.5万唐诗 + 26万宋诗 + 2.1万宋词 (基础数据) | MIT |
| [ChinesePoetryLibrary](https://github.com/byj233/ChinesePoetryLibrary) | 译文 / 赏析 / 注释 (富化数据) | MPL-2.0 |

## License

[MIT](./LICENSE)
