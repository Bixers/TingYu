package com.tencent.wxcloudrun.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.wxcloudrun.dao.AuthorMapper;
import com.tencent.wxcloudrun.dao.PoemMapper;
import com.tencent.wxcloudrun.model.Author;
import com.tencent.wxcloudrun.model.Poem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PoemCrawlerService {

    @Autowired
    private PoemMapper poemMapper;

    @Autowired
    private AuthorMapper authorMapper;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // chinese-poetry GitHub 原始文件基础URL
    private static final String BASE_URL = "https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/";

    // ChinesePoetryLibrary 富化数据源（含译文/赏析/注释）
    private static final String ENRICHED_BASE_URL = "https://raw.githubusercontent.com/byj233/ChinesePoetryLibrary/main/";

    // 标签关键词映射
    private static final Map<String, String[]> TAG_KEYWORDS = new LinkedHashMap<>();
    static {
        TAG_KEYWORDS.put("春天", new String[]{"春", "花", "柳", "燕", "桃", "杏"});
        TAG_KEYWORDS.put("夏天", new String[]{"夏", "荷", "蝉", "暑", "蛙"});
        TAG_KEYWORDS.put("秋天", new String[]{"秋", "菊", "霜", "枫", "落叶"});
        TAG_KEYWORDS.put("冬天", new String[]{"冬", "雪", "寒", "梅", "冰"});
        TAG_KEYWORDS.put("月亮", new String[]{"月", "明月", "婵娟", "玉盘"});
        TAG_KEYWORDS.put("山水", new String[]{"山", "水", "江", "河", "湖", "海", "溪", "峰", "岭"});
        TAG_KEYWORDS.put("思乡", new String[]{"乡", "故", "归", "客", "故园", "家"});
        TAG_KEYWORDS.put("爱情", new String[]{"情", "爱", "相思", "恋", "佳人", "红颜"});
        TAG_KEYWORDS.put("哲理", new String[]{"理", "悟", "道", "知", "须", "莫"});
        TAG_KEYWORDS.put("写景", new String[]{"景", "色", "风", "云", "雨", "烟", "雾", "霞"});
        TAG_KEYWORDS.put("田园", new String[]{"田", "园", "农", "牧", "村", "篱"});
        TAG_KEYWORDS.put("励志", new String[]{"志", "壮", "豪", "雄", "千里", "万里"});
        TAG_KEYWORDS.put("孤独", new String[]{"独", "孤", "寂", "寞", "空"});
        TAG_KEYWORDS.put("离别", new String[]{"别", "离", "送", "去", "行"});
        TAG_KEYWORDS.put("抒情", new String[]{"愁", "恨", "悲", "喜", "泪", "叹"});
    }

    /**
     * 从 chinese-poetry 导入唐诗
     * @param limit 导入数量限制
     * @return 实际导入数量
     */
    public int importTangPoems(int limit) {
        int imported = 0;
        // 唐诗文件：全唐诗共 poet.tang.0 ~ poet.tang.57000，每文件1000首
        for (int i = 0; i <= 57000 && imported < limit; i += 1000) {
            String file = "全唐诗/poet.tang." + i + ".json";
            try {
                int count = importFromFile(file, "唐", limit - imported);
                imported += count;
                if (count > 0) {
                    System.out.println("已从 " + file + " 导入 " + count + " 首唐诗");
                }
            } catch (Exception e) {
                System.err.println("导入 " + file + " 失败: " + e.getMessage());
            }
        }
        return imported;
    }

    /**
     * 从 chinese-poetry 导入宋诗
     */
    public int importSongPoems(int limit) {
        int imported = 0;
        // 宋诗文件：poet.song.0 ~ poet.song.254000
        for (int i = 0; i <= 254000 && imported < limit; i += 1000) {
            String file = "全唐诗/poet.song." + i + ".json";
            try {
                int count = importFromFile(file, "宋", limit - imported);
                imported += count;
                if (count > 0) {
                    System.out.println("已从 " + file + " 导入 " + count + " 首宋诗");
                }
            } catch (Exception e) {
                // 文件不存在时静默跳过（404）
                if (!e.getMessage().contains("404")) {
                    System.err.println("导入 " + file + " 失败: " + e.getMessage());
                }
            }
        }
        return imported;
    }

    /**
     * 从 chinese-poetry 导入宋词
     */
    public int importSongCi(int limit) {
        int imported = 0;
        // 宋词文件：ci.song.0 ~ ci.song.21000
        for (int i = 0; i <= 21000 && imported < limit; i += 1000) {
            String file = "宋词/ci.song." + i + ".json";
            try {
                int count = importCiFromFile(file, limit - imported);
                imported += count;
                if (count > 0) {
                    System.out.println("已从 " + file + " 导入 " + count + " 首宋词");
                }
            } catch (Exception e) {
                if (!e.getMessage().contains("404")) {
                    System.err.println("导入 " + file + " 失败: " + e.getMessage());
                }
            }
        }
        return imported;
    }

    /**
     * 从JSON文件导入诗（唐诗/宋诗格式）
     */
    private int importFromFile(String filePath, String dynasty, int limit) throws Exception {
        String url = BASE_URL + filePath;
        String json = restTemplate.getForObject(url, String.class);
        if (json == null) return 0;

        List<Map<String, Object>> poems = objectMapper.readValue(json,
            new TypeReference<List<Map<String, Object>>>() {});

        int imported = 0;
        for (Map<String, Object> poemData : poems) {
            if (imported >= limit) break;

            String title = (String) poemData.get("title");
            String author = (String) poemData.get("author");
            @SuppressWarnings("unchecked")
            List<String> paragraphs = (List<String>) poemData.get("paragraphs");

            if (title == null || author == null || paragraphs == null || paragraphs.isEmpty()) {
                continue;
            }

            // 过滤过长的诗词（保持适合卡片展示的长度）
            if (paragraphs.size() > 20) continue;
            // 过滤标题为空或过长的
            if (title.trim().isEmpty() || title.length() > 50) continue;

            // 去重检查
            if (poemMapper.countByTitleAndAuthor(title, author) > 0) {
                continue;
            }

            Poem poem = new Poem();
            poem.setId(generateId());
            poem.setTitle(title);
            poem.setDynasty(dynasty);
            poem.setAuthor(author);
            poem.setContent(objectMapper.writeValueAsString(paragraphs));
            poem.setTags(inferTags(title, paragraphs));
            poem.setSource("chinese-poetry");
            poem.setSourceUrl("https://github.com/chinese-poetry/chinese-poetry");
            poem.setCreatedAt(LocalDateTime.now());
            poem.setUpdatedAt(LocalDateTime.now());

            try {
                poemMapper.insert(poem);
                imported++;
            } catch (Exception e) {
                System.err.println("插入诗词 [" + title + "] 失败: " + e.getMessage());
            }
        }
        return imported;
    }

    /**
     * 从JSON文件导入宋词
     */
    private int importCiFromFile(String filePath, int limit) throws Exception {
        String url = BASE_URL + filePath;
        String json = restTemplate.getForObject(url, String.class);
        if (json == null) return 0;

        List<Map<String, Object>> ciList = objectMapper.readValue(json,
            new TypeReference<List<Map<String, Object>>>() {});

        int imported = 0;
        for (Map<String, Object> ciData : ciList) {
            if (imported >= limit) break;

            String rhythmic = (String) ciData.get("rhythmic"); // 词牌名
            String author = (String) ciData.get("author");
            @SuppressWarnings("unchecked")
            List<String> paragraphs = (List<String>) ciData.get("paragraphs");

            if (rhythmic == null || author == null || paragraphs == null || paragraphs.isEmpty()) {
                continue;
            }
            if (paragraphs.size() > 20) continue;

            // 去重检查
            if (poemMapper.countByTitleAndAuthor(rhythmic, author) > 0) {
                continue;
            }

            Poem poem = new Poem();
            poem.setId(generateId());
            poem.setTitle(rhythmic);
            poem.setDynasty("宋");
            poem.setAuthor(author);
            poem.setContent(objectMapper.writeValueAsString(paragraphs));
            poem.setTags(inferTags(rhythmic, paragraphs));
            poem.setSource("chinese-poetry");
            poem.setSourceUrl("https://github.com/chinese-poetry/chinese-poetry");
            poem.setCreatedAt(LocalDateTime.now());
            poem.setUpdatedAt(LocalDateTime.now());

            try {
                poemMapper.insert(poem);
                imported++;
            } catch (Exception e) {
                System.err.println("插入宋词 [" + rhythmic + "] 失败: " + e.getMessage());
            }
        }
        return imported;
    }

    /**
     * 根据内容自动推断标签
     */
    private String inferTags(String title, List<String> paragraphs) {
        String fullText = title + String.join("", paragraphs);
        List<String> matchedTags = new ArrayList<>();

        for (Map.Entry<String, String[]> entry : TAG_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (fullText.contains(keyword)) {
                    matchedTags.add(entry.getKey());
                    break;
                }
            }
        }

        // 如果没有匹配到任何标签，添加默认标签
        if (matchedTags.isEmpty()) {
            matchedTags.add("抒情");
        }

        // 最多保留5个标签
        if (matchedTags.size() > 5) {
            matchedTags = matchedTags.subList(0, 5);
        }

        try {
            return new ObjectMapper().writeValueAsString(matchedTags);
        } catch (Exception e) {
            return "[\"抒情\"]";
        }
    }

    /**
     * 从 chinese-poetry 导入作者信息
     */
    public int importAuthors(int limit) {
        int imported = 0;
        String[][] sources = {
            {"全唐诗/authors.tang.json", "唐"},
            {"全唐诗/authors.song.json", "宋"}
        };

        for (String[] source : sources) {
            if (imported >= limit) break;
            try {
                String url = BASE_URL + source[0];
                String json = restTemplate.getForObject(url, String.class);
                if (json == null) continue;

                List<Map<String, Object>> authorList = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, Object>>>() {});

                for (Map<String, Object> data : authorList) {
                    if (imported >= limit) break;
                    String name = (String) data.get("name");
                    String desc = (String) data.get("desc");
                    if (name == null || name.trim().isEmpty()) continue;
                    if (desc == null || desc.trim().isEmpty()) continue;

                    // 去重
                    if (authorMapper.countByName(name) > 0) continue;

                    Author author = new Author();
                    author.setId("author_" + System.currentTimeMillis() + "_" +
                        UUID.randomUUID().toString().substring(0, 8));
                    author.setName(name);
                    author.setDynasty(source[1]);
                    author.setDescription(desc);
                    author.setCreatedAt(LocalDateTime.now());
                    author.setUpdatedAt(LocalDateTime.now());

                    try {
                        authorMapper.insert(author);
                        imported++;
                    } catch (Exception e) {
                        System.err.println("插入作者 [" + name + "] 失败: " + e.getMessage());
                    }
                }
                System.out.println("已从 " + source[0] + " 处理作者数据");
            } catch (Exception e) {
                System.err.println("导入作者 " + source[0] + " 失败: " + e.getMessage());
            }
        }
        return imported;
    }

    /**
     * 从 ChinesePoetryLibrary 导入富化诗词数据（含译文/赏析/注释）
     * 策略：已存在的诗词更新富化字段，不存在的插入新记录
     * @param limit 最大处理条数（插入+更新）
     * @return 实际处理数量
     */
    public int importEnrichedPoems(int limit) {
        int total = 0;
        // 唐诗：tang_0.json ~ tang_54.json（55个文件，每个1000首）
        for (int i = 0; i < 55 && total < limit; i++) {
            try {
                int count = importEnrichedFromFile("唐/tang_" + i + ".json", "唐", limit - total);
                total += count;
                if (count > 0) {
                    System.out.println("富化导入 tang_" + i + ".json: " + count + " 首");
                }
            } catch (Exception e) {
                System.err.println("富化导入 tang_" + i + ".json 失败: " + e.getMessage());
            }
        }
        // 宋词：songci_0.json ~ songci_19.json（20个文件）
        for (int i = 0; i < 20 && total < limit; i++) {
            try {
                int count = importEnrichedFromFile("宋/词/songci_" + i + ".json", "宋", limit - total);
                total += count;
                if (count > 0) {
                    System.out.println("富化导入 songci_" + i + ".json: " + count + " 首");
                }
            } catch (Exception e) {
                System.err.println("富化导入 songci_" + i + ".json 失败: " + e.getMessage());
            }
        }
        return total;
    }

    /**
     * 从单个富化JSON文件导入/更新诗词
     */
    @SuppressWarnings("unchecked")
    private int importEnrichedFromFile(String filePath, String dynasty, int limit) throws Exception {
        String url = ENRICHED_BASE_URL + filePath;
        String json = restTemplate.getForObject(url, String.class);
        if (json == null) return 0;

        List<Map<String, Object>> poems = objectMapper.readValue(json,
            new TypeReference<List<Map<String, Object>>>() {});

        int processed = 0;
        for (Map<String, Object> data : poems) {
            if (processed >= limit) break;

            String title = (String) data.get("title");
            String author = (String) data.get("author");
            String content = (String) data.get("content");
            String translation = (String) data.get("translation");
            String appreciation = (String) data.get("appreciation");
            Object explanation = data.get("explanation");
            Object tags = data.get("tags");

            if (title == null || author == null || content == null) continue;
            if (title.trim().isEmpty()) continue;

            // 将 explanation 数组序列化为 JSON 字符串存入 annotation 字段
            String annotationJson = null;
            if (explanation != null) {
                try {
                    annotationJson = objectMapper.writeValueAsString(explanation);
                } catch (Exception ignored) {}
            }

            // 将 tags 数组序列化为 JSON 字符串
            String tagsJson = null;
            if (tags != null) {
                try {
                    tagsJson = objectMapper.writeValueAsString(tags);
                } catch (Exception ignored) {}
            }

            // 检查诗词是否已存在
            Poem existing = poemMapper.findByTitleAndAuthor(title, author);
            if (existing != null) {
                // 已存在：仅更新空缺的富化字段
                boolean needUpdate = false;
                if (isBlank(existing.getTranslation()) && translation != null && !translation.isEmpty()) {
                    existing.setTranslation(translation);
                    needUpdate = true;
                }
                if (isBlank(existing.getAppreciation()) && appreciation != null && !appreciation.isEmpty()) {
                    existing.setAppreciation(appreciation);
                    needUpdate = true;
                }
                if (isBlank(existing.getAnnotation()) && annotationJson != null) {
                    existing.setAnnotation(annotationJson);
                    needUpdate = true;
                }
                if (needUpdate) {
                    // tags 如果源数据更丰富也一并更新
                    if (tagsJson != null && !tagsJson.equals("[]")) {
                        existing.setTags(tagsJson);
                    }
                    try {
                        poemMapper.updateEnrichment(existing);
                        processed++;
                    } catch (Exception e) {
                        System.err.println("更新富化 [" + title + "] 失败: " + e.getMessage());
                    }
                }
            } else {
                // 不存在：插入新诗词
                String[] lines = content.split("\n");
                if (lines.length > 20) continue;
                if (title.length() > 50) continue;

                String contentJson = objectMapper.writeValueAsString(Arrays.asList(lines));

                Poem poem = new Poem();
                poem.setId(generateId());
                poem.setTitle(title);
                poem.setDynasty(dynasty);
                poem.setAuthor(author);
                poem.setContent(contentJson);
                poem.setTranslation(translation);
                poem.setAppreciation(appreciation);
                poem.setAnnotation(annotationJson);
                poem.setTags(tagsJson != null && !tagsJson.equals("[]") ? tagsJson : inferTags(title, Arrays.asList(lines)));
                poem.setSource("ChinesePoetryLibrary");
                poem.setSourceUrl("https://github.com/byj233/ChinesePoetryLibrary");
                poem.setCreatedAt(LocalDateTime.now());
                poem.setUpdatedAt(LocalDateTime.now());

                try {
                    poemMapper.insert(poem);
                    processed++;
                } catch (Exception e) {
                    System.err.println("插入富化诗词 [" + title + "] 失败: " + e.getMessage());
                }
            }
        }
        return processed;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /**
     * 应用启动完成后异步执行一次诗词导入
     * 使用 ApplicationReadyEvent 确保应用完全就绪（含健康检查）后再执行
     * @Async 保证不阻塞主线程
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onStartupImport() {
        System.out.println("===== 启动时异步诗词导入任务开始 =====");
        try {
            int limitPerSource = 500;
            int tang = importTangPoems(limitPerSource);
            int song = importSongPoems(limitPerSource);
            int songci = importSongCi(limitPerSource);
            int authors = importAuthors(500);
            int enriched = importEnrichedPoems(2000);
            System.out.println("===== 启动导入完成: 唐诗=" + tang + " 宋诗=" + song
                + " 宋词=" + songci + " 作者=" + authors + " 富化=" + enriched + " =====");
        } catch (Exception e) {
            System.err.println("===== 启动导入异常: " + e.getMessage() + " =====");
        }
    }

    /**
     * 每周一凌晨3点自动执行诗词导入
     * 去重逻辑已内置：title+author 重复的不会重复插入
     */
    @Scheduled(cron = "0 0 3 ? * MON")
    public void scheduledImport() {
        System.out.println("===== 定时诗词导入任务开始 =====");
        try {
            int limitPerSource = 500;
            int tang = importTangPoems(limitPerSource);
            int song = importSongPoems(limitPerSource);
            int songci = importSongCi(limitPerSource);
            int authors = importAuthors(500);
            int enriched = importEnrichedPoems(5000);
            System.out.println("===== 定时导入完成: 唐诗=" + tang + " 宋诗=" + song
                + " 宋词=" + songci + " 作者=" + authors + " 富化=" + enriched + " =====");
        } catch (Exception e) {
            System.err.println("===== 定时导入异常: " + e.getMessage() + " =====");
        }
    }

    private String generateId() {
        return "poem_" + System.currentTimeMillis() + "_" +
               UUID.randomUUID().toString().substring(0, 8);
    }
}
