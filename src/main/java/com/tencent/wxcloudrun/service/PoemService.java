package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.DailyPoemMapper;
import com.tencent.wxcloudrun.dao.PoemMapper;
import com.tencent.wxcloudrun.dto.PageResult;
import com.tencent.wxcloudrun.model.DailyPoem;
import com.tencent.wxcloudrun.model.Poem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PoemService {

    @Autowired
    private PoemMapper poemMapper;

    @Autowired
    private DailyPoemMapper dailyPoemMapper;

    /**
     * 获取每日诗词
     */
    public Poem getDailyPoem() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        
        // 先查询今天是否已有推荐
        DailyPoem existing = dailyPoemMapper.findByDate(today);
        if (existing != null) {
            return existing.getPoem();
        }
        
        // 根据日期哈希选择诗词
        List<Poem> allPoems = poemMapper.findAll();
        if (allPoems.isEmpty()) {
            return null;
        }
        
        int hash = today.hashCode();
        int index = Math.abs(hash) % allPoems.size();
        Poem selectedPoem = allPoems.get(index);
        
        // 保存每日推荐记录
        DailyPoem dailyPoem = new DailyPoem();
        dailyPoem.setId(generateId());
        dailyPoem.setPoemId(selectedPoem.getId());
        dailyPoem.setDate(today);
        dailyPoem.setCreatedAt(java.time.LocalDateTime.now());
        dailyPoemMapper.insert(dailyPoem);
        
        return selectedPoem;
    }

    /**
     * 获取随机诗词
     */
    public Poem getRandomPoem() {
        return poemMapper.findRandomPoem();
    }

    /**
     * 根据ID获取诗词详情
     */
    public Poem getPoemById(String id) {
        return poemMapper.findById(id);
    }

    /**
     * 获取诗词列表（支持分页、筛选）
     */
    public PageResult<Poem> getPoemList(Integer page, Integer pageSize, String keyword, String dynasty, String tag) {
        int offset = (page - 1) * pageSize;
        
        List<Poem> list = poemMapper.searchPoems(keyword, dynasty, offset, pageSize);
        Long total = poemMapper.countSearchPoems(keyword, dynasty);
        
        // 标签筛选（内存中过滤）
        if (tag != null && !tag.isEmpty()) {
            list.removeIf(poem -> !hasTag(poem, tag));
        }
        
        return new PageResult<>(list, total, page, pageSize);
    }

    /**
     * 搜索诗词
     */
    public PageResult<Poem> searchPoems(String keyword, Integer page, Integer pageSize) {
        return getPoemList(page, pageSize, keyword, null, null);
    }

    /**
     * 检查诗词是否包含指定标签
     */
    private boolean hasTag(Poem poem, String tag) {
        if (poem.getTags() == null || poem.getTags().isEmpty()) {
            return false;
        }
        return poem.getTags().contains(tag);
    }

    /**
     * 生成唯一ID
     */
    private String generateId() {
        return "poem_" + System.currentTimeMillis() + "_" + 
               UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 初始化模拟数据（启动时清除乱码数据并重新插入）
     */
    @PostConstruct
    public void initMockData() {
        try {
        List<Poem> existing = poemMapper.findAll();

        // 检测乱码数据：标题包含非正常中文字符视为乱码
        boolean hasCorrupted = false;
        for (Poem poem : existing) {
            if (isCorrupted(poem)) {
                hasCorrupted = true;
                break;
            }
        }

        if (hasCorrupted) {
            System.out.println("\u68C0\u6D4B\u5230\u4E71\u7801\u6570\u636E\uFF0C\u6E05\u9664\u5168\u90E8\u8BD7\u8BCD\u5E76\u91CD\u65B0\u521D\u59CB\u5316...");
            poemMapper.deleteAll();
            existing = Collections.emptyList();
        }

        if (!existing.isEmpty()) {
            System.out.println("\u6570\u636E\u5E93\u5DF2\u6709 " + existing.size() + " \u9996\u8BD7\u8BCD\uFF0C\u8DF3\u8FC7\u521D\u59CB\u5316");
            return;
        }
        
        System.out.println("\u5F00\u59CB\u521D\u59CB\u5316\u8BD7\u8BCD\u6570\u636E...");
        
        List<Poem> mockPoems = Arrays.asList(
            createPoem("\u6625\u6653", "\u5510", "\u5B5F\u6D69\u7136", 
                "[\"\u6625\u7720\u4E0D\u89C9\u6653\uFF0C\", \"\u5904\u5904\u95FB\u557C\u9E1F\u3002\", \"\u591C\u6765\u98CE\u96E8\u58F0\uFF0C\", \"\u82B1\u843D\u77E5\u591A\u5C11\u3002\"]",
                "\u6625\u5929\u7684\u591C\u665A\u7761\u5F97\u5F88\u9999\u751C\uFF0C\u4E0D\u77E5\u4E0D\u89C9\u5929\u5C31\u4EAE\u4E86\u3002\u9192\u6765\u65F6\u5230\u5904\u90FD\u80FD\u542C\u5230\u9E1F\u513F\u7684\u557C\u53EB\u58F0\u3002\u56DE\u60F3\u8D77\u6628\u5929\u591C\u91CC\u7684\u98CE\u96E8\u58F0\uFF0C\u4E0D\u77E5\u9053\u6709\u591A\u5C11\u82B1\u513F\u88AB\u6253\u843D\u4E86\u3002",
                "\u2460\u6653\uFF1A\u5929\u4EAE\u3002\u2461\u95FB\uFF1A\u542C\u5230\u3002\u2462\u557C\u9E1F\uFF1A\u9E1F\u557C\uFF0C\u9E1F\u513F\u9E23\u53EB\u3002",
                "\u8FD9\u9996\u8BD7\u63CF\u5199\u4E86\u6625\u5929\u65E9\u6668\u7684\u666F\u8272\uFF0C\u8868\u8FBE\u4E86\u8BD7\u4EBA\u5BF9\u6625\u5929\u7684\u559C\u7231\u4E4B\u60C5\u3002\u5168\u8BD7\u8BED\u8A00\u6E05\u65B0\u81EA\u7136\uFF0C\u610F\u5883\u4F18\u7F8E\uFF0C\u662F\u63CF\u5199\u6625\u666F\u7684\u540D\u7BC7\u3002",
                "[\"\u6625\u5929\", \"\u5199\u666F\", \"\u7530\u56ED\"]"),
                
            createPoem("\u9759\u591C\u601D", "\u5510", "\u674E\u767D",
                "[\"\u5E8A\u524D\u660E\u6708\u5149\uFF0C\", \"\u7591\u662F\u5730\u4E0A\u971C\u3002\", \"\u4E3E\u5934\u671B\u660E\u6708\uFF0C\", \"\u4F4E\u5934\u601D\u6545\u4E61\u3002\"]",
                "\u660E\u4EAE\u7684\u6708\u5149\u6D12\u5728\u5E8A\u524D\uFF0C\u597D\u50CF\u5730\u4E0A\u94FA\u4E86\u4E00\u5C42\u767D\u971C\u3002\u6211\u62AC\u5934\u671B\u7740\u5929\u4E0A\u7684\u660E\u6708\uFF0C\u4E0D\u7531\u5F97\u4F4E\u5934\u601D\u5FF5\u8D77\u6545\u4E61\u6765\u3002",
                "\u2460\u7591\uFF1A\u6000\u7591\u3002\u2461\u4E3E\u5934\uFF1A\u62AC\u5934\u3002",
                "\u8FD9\u9996\u8BD7\u5199\u7684\u662F\u5728\u5BC2\u9759\u7684\u6708\u591C\u601D\u5FF5\u5BB6\u4E61\u7684\u611F\u53D7\u3002\u8BD7\u7684\u524D\u4E24\u53E5\u5199\u666F\uFF0C\u540E\u4E24\u53E5\u6292\u60C5\uFF0C\u8BED\u8A00\u6734\u7D20\u800C\u611F\u60C5\u771F\u631A\uFF0C\u662F\u5343\u53E4\u4F20\u8BF5\u7684\u601D\u4E61\u540D\u7BC7\u3002",
                "[\"\u601D\u4E61\", \"\u6708\u4EAE\", \"\u6292\u60C5\"]"),
                
            createPoem("\u767B\u9E73\u96C0\u697C", "\u5510", "\u738B\u4E4B\u6DA3",
                "[\"\u767D\u65E5\u4F9D\u5C71\u5C3D\uFF0C\", \"\u9EC4\u6CB3\u5165\u6D77\u6D41\u3002\", \"\u6B32\u7A77\u5343\u91CC\u76EE\uFF0C\", \"\u66F4\u4E0A\u4E00\u5C42\u697C\u3002\"]",
                "\u5915\u9633\u4F9D\u508D\u7740\u897F\u5C71\u6162\u6162\u843D\u4E0B\uFF0C\u6ED4\u6ED4\u9EC4\u6CB3\u671D\u7740\u4E1C\u6D77\u6C79\u6D8C\u5954\u6D41\u3002\u82E5\u60F3\u628A\u5343\u91CC\u7684\u98CE\u5149\u666F\u7269\u770B\u591F\uFF0C\u90A3\u5C31\u8981\u767B\u4E0A\u66F4\u9AD8\u7684\u4E00\u5C42\u57CE\u697C\u3002",
                "\u2460\u9E73\u96C0\u697C\uFF1A\u65E7\u5740\u5728\u4ECA\u5C71\u897F\u6C38\u6D4E\u53BF\u3002\u2461\u7A77\uFF1A\u5C3D\uFF0C\u4F7F\u8FBE\u5230\u6781\u70B9\u3002",
                "\u8FD9\u9996\u8BD7\u5199\u8BD7\u4EBA\u5728\u767B\u9AD8\u671B\u8FDC\u4E2D\u8868\u73B0\u51FA\u6765\u7684\u4E0D\u51E1\u7684\u80F8\u895F\u62B1\u8D1F\uFF0C\u53CD\u6620\u4E86\u76DB\u5510\u65F6\u671F\u4EBA\u4EEC\u79EF\u6781\u5411\u4E0A\u7684\u8FDB\u53D6\u7CBE\u795E\u3002\u540E\u4E24\u53E5\u5BCC\u542B\u54F2\u7406\uFF0C\u6210\u4E3A\u5343\u53E4\u540D\u53E5\u3002",
                "[\"\u54F2\u7406\", \"\u5C71\u6C34\", \"\u52B1\u5FD7\"]"),
                
            createPoem("\u6C5F\u96EA", "\u5510", "\u67F3\u5B97\u5143",
                "[\"\u5343\u5C71\u9E1F\u98DE\u7EDD\uFF0C\", \"\u4E07\u5F84\u4EBA\u8E2A\u706D\u3002\", \"\u5B64\u821F\u84D1\u7B20\u7FC1\uFF0C\", \"\u72EC\u9493\u5BD2\u6C5F\u96EA\u3002\"]",
                "\u6240\u6709\u7684\u5C71\u4E0A\uFF0C\u98DE\u9E1F\u7684\u8EAB\u5F71\u5DF2\u7ECF\u7EDD\u8FF9\uFF0C\u6240\u6709\u7684\u5C0F\u8DEF\uFF0C\u4EBA\u7684\u8E2A\u8FF9\u4E5F\u6CA1\u6709\u4E86\u3002\u6C5F\u9762\u5B64\u821F\u4E0A\uFF0C\u4E00\u4F4D\u62AB\u6234\u7740\u84D1\u7B20\u7684\u8001\u7FC1\uFF0C\u72EC\u81EA\u5728\u5927\u96EA\u8986\u76D6\u7684\u5BD2\u51B7\u6C5F\u9762\u4E0A\u5782\u9493\u3002",
                "\u2460\u7EDD\uFF1A\u65E0\uFF0C\u6CA1\u6709\u3002\u2461\u4E07\u5F84\uFF1A\u865A\u6307\uFF0C\u6307\u5343\u4E07\u6761\u8DEF\u3002\u2462\u84D1\u7B20\uFF1A\u84D1\u8863\u548C\u6597\u7B20\u3002",
                "\u8FD9\u9996\u8BD7\u63CF\u7ED8\u4E86\u4E00\u5E45\u5BC4\u5174\u9AD8\u6D01\u3001\u5BD3\u610F\u4E30\u5BCC\u7684\u5BD2\u6C5F\u72EC\u9493\u56FE\u3002\u8BD7\u4E2D\"\u5B64\u821F\u84D1\u7B20\u7FC1\"\u7684\u5F62\u8C61\uFF0C\u6B63\u662F\u8BD7\u4EBA\u6E05\u9AD8\u5B64\u50B2\u3001\u4E0D\u613F\u4E0E\u4E16\u4FD7\u540C\u6D41\u5408\u6C61\u7684\u6027\u683C\u5199\u7167\u3002",
                "[\"\u51AC\u5929\", \"\u5199\u666F\", \"\u5B64\u72EC\"]"),
                
            createPoem("\u6C34\u8C03\u6B4C\u5934", "\u5B8B", "\u82CF\u8F7C",
                "[\"\u660E\u6708\u51E0\u65F6\u6709\uFF1F\u628A\u9152\u95EE\u9752\u5929\u3002\", \"\u4E0D\u77E5\u5929\u4E0A\u5BAB\u9619\uFF0C\u4ECA\u5915\u662F\u4F55\u5E74\u3002\", \"\u6211\u6B32\u4E58\u98CE\u5F52\u53BB\uFF0C\u53C8\u6050\u743C\u697C\u7389\u5B87\uFF0C\", \"\u9AD8\u5904\u4E0D\u80DC\u5BD2\u3002\", \"\u8D77\u821E\u5F04\u6E05\u5F71\uFF0C\u4F55\u4F3C\u5728\u4EBA\u95F4\u3002\", \"\u8F6C\u6731\u9601\uFF0C\u4F4E\u7EEE\u6237\uFF0C\u7167\u65E0\u7720\u3002\", \"\u4E0D\u5E94\u6709\u6068\uFF0C\u4F55\u4E8B\u957F\u5411\u522B\u65F6\u5706\uFF1F\", \"\u4EBA\u6709\u60B2\u6B22\u79BB\u5408\uFF0C\u6708\u6709\u9634\u6674\u5706\u7F3A\uFF0C\", \"\u6B64\u4E8B\u53E4\u96BE\u5168\u3002\", \"\u4F46\u613F\u4EBA\u957F\u4E45\uFF0C\u5343\u91CC\u5171\u5A75\u5A1F\u3002\"]",
                "\u660E\u6708\u4ECE\u4EC0\u4E48\u65F6\u5019\u624D\u5F00\u59CB\u51FA\u73B0\u7684\uFF1F\u6211\u7AEF\u8D77\u9152\u676F\u9065\u95EE\u82CD\u5929\u3002\u4E0D\u77E5\u9053\u5728\u5929\u4E0A\u7684\u5BAB\u6BBF\uFF0C\u4ECA\u5929\u665A\u4E0A\u662F\u4F55\u5E74\u4F55\u6708\u3002\u6211\u60F3\u8981\u4E58\u5FA1\u6E05\u98CE\u56DE\u5230\u5929\u4E0A\uFF0C\u53C8\u6050\u6015\u5728\u7F8E\u7389\u780C\u6210\u7684\u697C\u5B87\uFF0C\u53D7\u4E0D\u4F4F\u9AD8\u8038\u4E5D\u5929\u7684\u5BD2\u51B7\u3002\u7FE9\u7FE9\u8D77\u821E\u73A9\u8D4F\u7740\u6708\u4E0B\u6E05\u5F71\uFF0C\u54EA\u50CF\u662F\u5728\u4EBA\u95F4\u3002\u6708\u513F\u8F6C\u8FC7\u6731\u7EA2\u8272\u7684\u697C\u9601\uFF0C\u4F4E\u4F4E\u5730\u6302\u5728\u96D5\u82B1\u7684\u7A97\u6237\u4E0A\uFF0C\u7167\u7740\u6CA1\u6709\u7761\u610F\u7684\u4EBA\u3002\u660E\u6708\u4E0D\u8BE5\u5BF9\u4EBA\u4EEC\u6709\u4EC0\u4E48\u6028\u6068\u5427\uFF0C\u4E3A\u4EC0\u4E48\u504F\u5728\u4EBA\u4EEC\u79BB\u522B\u65F6\u624D\u5706\u5462\uFF1F\u4EBA\u6709\u60B2\u6B22\u79BB\u5408\u7684\u53D8\u8FC1\uFF0C\u6708\u6709\u9634\u6674\u5706\u7F3A\u7684\u8F6C\u6362\uFF0C\u8FD9\u79CD\u4E8B\u81EA\u53E4\u6765\u96BE\u4EE5\u5468\u5168\u3002\u53EA\u5E0C\u671B\u8FD9\u4E16\u4E0A\u6240\u6709\u4EBA\u7684\u4EB2\u4EBA\u80FD\u5E73\u5B89\u5065\u5EB7\uFF0C\u5373\u4FBF\u76F8\u9694\u5343\u91CC\uFF0C\u4E5F\u80FD\u5171\u4EAB\u8FD9\u7F8E\u597D\u7684\u6708\u5149\u3002",
                "\u2460\u5BAB\u9619\uFF1A\u5BAB\u6BBF\u3002\u2461\u5F52\u53BB\uFF1A\u56DE\u5230\u5929\u4E0A\u53BB\u3002\u2462\u743C\u697C\u7389\u5B87\uFF1A\u7F8E\u7389\u780C\u6210\u7684\u697C\u5B87\u3002\u2463\u5A75\u5A1F\uFF1A\u6307\u6708\u4EAE\u3002",
                "\u8FD9\u9996\u8BCD\u662F\u4E2D\u79CB\u671B\u6708\u6000\u4EBA\u4E4B\u4F5C\uFF0C\u8868\u8FBE\u4E86\u5BF9\u80DE\u5F1F\u82CF\u8F99\u7684\u65E0\u9650\u601D\u5FF5\u3002\u8BCD\u4EBA\u8FD0\u7528\u5F62\u8C61\u7684\u63CF\u7ED8\u548C\u6D6A\u6F2B\u4E3B\u4E49\u7684\u60F3\u8C61\uFF0C\u7D27\u7D27\u56F4\u7ED5\u4E2D\u79CB\u4E4B\u6708\u5C55\u5F00\u63CF\u5199\u3001\u6292\u60C5\u548C\u8BAE\u8BBA\uFF0C\u4ECE\u5929\u4E0A\u4E0E\u4EBA\u95F4\u3001\u6708\u4E0E\u4EBA\u3001\u7A7A\u95F4\u4E0E\u65F6\u95F4\u8FD9\u4E9B\u76F8\u8054\u7CFB\u7684\u8303\u7574\u8FDB\u884C\u601D\u8003\uFF0C\u628A\u4EBA\u4E16\u95F4\u7684\u60B2\u6B22\u79BB\u5408\u4E4B\u60C5\u7EB3\u5165\u5BF9\u5B87\u5B99\u4EBA\u751F\u7684\u54F2\u7406\u6027\u8FFD\u5BFB\u4E4B\u4E2D\u3002",
                "[\"\u4E2D\u79CB\", \"\u6708\u4EAE\", \"\u54F2\u7406\", \"\u8C6A\u653E\"]")
        );
        
        for (Poem poem : mockPoems) {
            poemMapper.insert(poem);
        }
        
        System.out.println("\u521D\u59CB\u5316\u5B8C\u6210\uFF0C\u5171\u6DFB\u52A0 " + mockPoems.size() + " \u9996\u8BD7\u8BCD");
        } catch (Exception e) {
            System.err.println("\u8BD7\u8BCD\u6570\u636E\u521D\u59CB\u5316\u5931\u8D25\uFF08\u4E0D\u5F71\u54CD\u5E94\u7528\u542F\u52A8\uFF09: " + e.getMessage());
        }
    }

    /**
     * 检测诗词数据是否乱码
     * 正常的标题应全为常见CJK字符和标点，若包含大量非CJK字符则视为乱码
     */
    private boolean isCorrupted(Poem poem) {
        String title = poem.getTitle();
        if (title == null || title.isEmpty()) return true;
        int total = title.length();
        int normal = 0;
        for (char c : title.toCharArray()) {
            if (c >= '\u4E00' && c <= '\u9FFF') normal++;       // CJK基本区
            else if (c >= '\u3400' && c <= '\u4DBF') normal++;   // CJK扩展A
            else if (c >= '\uFF00' && c <= '\uFFEF') normal++;   // 全角标点
            else if (c >= '\u3000' && c <= '\u303F') normal++;   // CJK标点
            else if (c >= '\u0020' && c <= '\u007E') normal++;   // ASCII
        }
        // 标题中正常字符占比低于50%视为乱码
        return normal < total * 0.5;
    }
    
    private Poem createPoem(String title, String dynasty, String author, String content,
                           String translation, String annotation, String appreciation, String tags) {
        Poem poem = new Poem();
        poem.setId(generateId());
        poem.setTitle(title);
        poem.setDynasty(dynasty);
        poem.setAuthor(author);
        poem.setContent(content);
        poem.setTranslation(translation);
        poem.setAnnotation(annotation);
        poem.setAppreciation(appreciation);
        poem.setTags(tags);
        poem.setCreatedAt(java.time.LocalDateTime.now());
        poem.setUpdatedAt(java.time.LocalDateTime.now());
        return poem;
    }
}
