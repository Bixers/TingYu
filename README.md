# 听雨眠舟 (TingYu)

> 春水碧于天，画船听雨眠

古典诗词微信小程序，提供诗词浏览、搜索、卡片分享、拼音注音等功能。基于 Spring Boot + 微信云托管 + MySQL 构建。

## 功能特性

### 小程序端
- **首页** - 每日推荐 / 随机切换诗词卡片
- **发现** - 朝代筛选、标签筛选、关键词搜索，分页浏览
- **详情** - 注释 / 赏析 / 译文 Tab 切换，作者介绍，标签跳转，沉浸阅读模式
- **我的** - 微信授权登录（头像+昵称），修改资料，退出/重新绑定
- **繁简切换** - 诗词默认简体展示，首页/详情页一键繁简切换，跨页偏好同步
- **拼音** - 长按诗句/标题/作者显示带声调拼音，支持复制
- **卡片分享** - 5款模板（素纸/墨夜/竹青/淡金/烟雨），保存相册或分享好友
- **自适应卡片** - 长诗自动扩展卡片高度

### 后端服务
- **诗词爬虫** - 自动从 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 和 [ChinesePoetryLibrary](https://github.com/byj233/ChinesePoetryLibrary) 导入诗词数据
- **富化数据** - 自动匹配并补充译文、赏析、注释（词义对照）
- **定时任务** - 每周一凌晨自动导入新数据，启动时异步增量导入
- **智能标签** - 基于关键词自动推断诗词标签（季节/意象/题材/情感等）
- **拼音服务** - pinyin4j 中文转拼音（含声调）
- **用户系统** - 基于微信 OpenID 的用户注册/更新，头像云存储

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
    │   │   ├── UserController.java     用户 API (登录/注册/资料)
    │   │   ├── AdminController.java    管理接口 (触发导入)
    │   │   ├── ToolController.java     工具 API (拼音转换)
    │   │   └── IndexController.java    健康检查
    │   ├── service/
    │   │   ├── PoemService.java        诗词业务逻辑
    │   │   ├── PoemCrawlerService.java 爬虫 + 定时/启动导入
    │   │   ├── PinyinService.java      拼音转换
    │   │   ├── AuthorService.java      作者查询
    │   │   ├── TagService.java         标签查询
    │   │   ├── MetaService.java        统计查询
    │   │   └── UserService.java        用户注册/更新
    │   ├── dao/                        MyBatis Mapper 接口
    │   ├── model/                      实体类 (Poem, Author, Tag, DailyPoem, User)
    │   └── dto/                        DTO (ApiResponse, PageResult, PinyinResult)
    └── resources/
        ├── application.yml             数据库/端口配置
        ├── db.sql                      建表 + 初始数据
        ├── mapper/                     MyBatis XML 映射
        └── static/miniprogram/         微信小程序前端代码
            ├── app.js / app.json       小程序入口配置
            ├── utils/
            │   ├── api.js              统一 API 请求封装
            │   └── chinese-convert.js  繁简转换工具 (2500+ 字符映射)
            └── pages/
                ├── index/              首页 (每日诗词卡片)
                ├── detail/             详情页 (注释/赏析/译文/拼音)
                ├── discover/           发现页 (搜索/筛选/列表)
                ├── share/              卡片分享页 (Canvas 绘制)
                └── profile/            我的页面 (登录/资料/退出)
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
| GET | `/api/user/profile` | 获取当前用户信息 |
| POST | `/api/user/register` | 用户注册/更新资料 |
| POST | `/api/admin/import-poems` | 触发诗词导入 |

## 部署

### 微信云托管部署

1. 在微信云托管控制台创建服务
2. 关联 GitHub 仓库，自动构建部署
3. 配置环境变量：
   - `MYSQL_ADDRESS` - 数据库地址 (host:port)
   - `MYSQL_USERNAME` - 数据库用户名
   - `MYSQL_PASSWORD` - 数据库密码
   - `WECHAT_APPID` - 小程序 AppID
   - `WECHAT_SECRET` - 小程序密钥
   - `WECHAT_SUBSCRIBE_TEMPLATE_ID` - 每日雨丝订阅模板 ID
   - `WECHAT_SUBSCRIBE_PAGE` - 订阅消息跳转页，默认 `pages/detail/index`
   - `TENCENT_TTS_APP_ID` - 腾讯云语音合成 AppID
   - `TENCENT_TTS_SECRET_ID` - 腾讯云语音合成 SecretId
   - `TENCENT_TTS_SECRET_KEY` - 腾讯云语音合成 SecretKey
   - `TENCENT_TTS_VOICE` - 朗读音色，默认 `101001`
   - `TENCENT_TTS_SPEED` - 朗读语速，默认 `0`
   - `TENCENT_TTS_VOLUME` - 朗读音量，默认 `30`

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

## 更新记录

### v0.1.5 (2026-04-22)
- 小程序启动时关闭 `traceUser`，避免云初始化阶段拉起额外请求导致启动失败
- API 请求显式传入 `config.env` / `config.service`，提升云托管调用稳定性
- 详情页雨声改为底部常驻入口，更容易发现并一键进入沉浸阅读

### v0.1.4 (2026-04-22)
- 语音朗读改为接入腾讯云官方 Java SDK，修复自定义签名导致的 `AuthFailure.SignatureFailure`
- 每日雨丝推送时间调整为每天上午 `10:00`，并固定按 `Asia/Shanghai` 时区执行
- 修复详情页摘录弹窗交互：点击输入框不再误关弹窗，保存摘录时可稳定保留当前句子上下文

### v0.1.3 (2026-04-21)
- 语音朗读切换为腾讯云语音合成，支持国内环境直连与长文本任务
- 补充腾讯云 TTS 运行配置说明，便于在云托管或本地环境中启用朗读
- 雨声白噪音支持项目内兜底音频与云端地址双模式，避免未配置时不可用

### v0.1.2 (2026-04-21)
- 登录后统一生成固定昵称 `听雨客 + 四位随机数`，确保用户展示名称风格一致
- 用户头像统一使用项目内固定图标，不再依赖外部微信头像
- 登录态改为 token 持久化，token 未过期时可直接恢复登录，不必重复授权
- 进一步优化“我的”页信息展示，去除冗余的绑定提示

### v0.1.1 (2026-04-21)
- 新增雨声白噪音沉浸阅读模式，详情页支持檐下雨背景音与多音源切换
- 新增今日诗历打卡签，首页支持农历诗历展示与卡片分享
- 新增诗舟漂流与匿名回复，支持收藏、回复、最近收到摘要与漂流状态展示
- 新增摘录本与阅读足迹，支持句子摘录、私人批注、诗舟里程统计
- 新增每日雨丝订阅推送，接入订阅模板与后端定时发送链路
- 优化首页封面结构与诗舟页视觉层级，提升产品完整度

### v0.0.9 (2026-04-21)
- 新增收藏功能，支持全文收藏与句子收藏
- 详情页新增全文收藏按钮，复制原文弹窗新增句子收藏按钮
- “我的”页新增收藏入口，进入后可统一查看与取消收藏
- 后端新增收藏接口、收藏状态查询接口和收藏数据模型
- 收藏表支持按 `FULL` / `SENTENCE` 区分收藏粒度，旧库可执行仓库内的迁移 SQL

### v0.0.8 (2026-04-21)
- 修复“我的”页登录流程未正确拉起小程序头像昵称获取的问题
- 登录入口改为显式展示头像昵称表单，使用 `chooseAvatar` 与昵称输入能力完成资料获取
- 支持已登录用户重新获取并更新头像昵称，提交后同步覆盖本地缓存与后端用户资料

### v0.0.7 (2026-04-17)
- 首页首屏改为优先展示“每日推荐”，并增加“今日推荐 / 随机诗词”来源标识
- 优化“换一首”随机逻辑：前端记录最近浏览诗词，后端按排除列表随机返回，减少少量诗词来回切换的问题
- 随机诗词接口增加排除参数与防缓存时间戳，请求结果更稳定
- 项目启动后的脏数据清理改为异步后台分页扫描，不阻塞启动，不一次性全表载入内存
- 后台清理会删除空内容、空标题、空作者、空朝代及明显乱码诗词，并同步清理对应每日推荐关联记录

### v0.0.6 (2026-04-17)
- 新增"我的"页签（TabBar 第三项），含用户信息卡片
- 微信授权登录：chooseAvatar 选头像 + nickname 输入昵称
- 头像上传云存储，用户数据持久化到 MySQL users 表
- 支持修改资料（复用登录弹窗预填已有信息）
- 支持退出登录并重新绑定
- 后端新增 UserController / UserService / UserMapper 用户体系

### v0.0.5 (2026-04-17)
- 诗词默认简体展示，新增繁简转换工具（2500+ 字符映射）
- 首页/详情页添加繁/简一键切换按钮
- 发现页/分享页同步转换，跨页偏好自动同步
- 偏好持久化到 localStorage，重启自动恢复

### v0.0.4 (2026-04-16)
- 爬虫接入 ChinesePoetryLibrary 数据源，自动导入译文/赏析/注释
- 详情页注释 Tab 支持词义列表格式化展示
- 卡片分享页根据诗词行数动态计算 Canvas 高度，修复长诗溢出
- 导入限制从 50/源 提升至 500/源，富化导入 2000/次
- 修复作者数据路径 404（缺少 `全唐诗/` 目录前缀）
- 唐诗/宋诗/宋词改为动态遍历全部文件

### v0.0.3 (2026-04-16)
- 新增作者介绍（详情页可展开/收起）
- 新增标签点击跳转（点击标签筛选同标签诗词）
- 新增长按显示拼音（含声调）+ 复制原文
- 新增诗词爬虫定时任务（每周一凌晨自动导入）
- 新增启动时异步导入（@Async + ApplicationReadyEvent）
- 新增底部导航栏图标（首页/发现）
- 
### v0.0.2 (2026-04-16)
- 新增卡片分享页（5款模板，Canvas 2D 绘制）
- 新增发现页（朝代筛选、标签筛选、搜索、分页）
- 新增作者/标签/元数据/拼音 API

### v0.0.1 (2026-04-15)
- 项目初始化，基于微信云托管 Spring Boot 模板
- 实现诗词数据模型（Poem/Author/Tag/DailyPoem）
- 实现诗词 API（每日推荐/随机/详情/列表/搜索）
- 小程序首页诗词卡片展示
- 云函数调用改为 HTTP 云托管调用（callContainer）
- 数据库连接容错（HikariCP 初始化失败不阻塞启动）
- 修复 MyBatis Mapper 注解与 XML 双重定义冲突
