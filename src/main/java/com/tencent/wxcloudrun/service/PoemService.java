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
     * 初始化模拟数据
     */
    @PostConstruct
    public void initMockData() {
        try {
        List<Poem> existing = poemMapper.findAll();
        if (!existing.isEmpty()) {
            System.out.println("数据库已有数据，跳过初始化");
            return;
        }
        
        System.out.println("开始初始化诗词数据...");
        
        List<Poem> mockPoems = Arrays.asList(
            createPoem("春晓", "唐", "孟浩然", 
                "[\"春眠不觉晓，\", \"处处闻啼鸟。\", \"夜来风雨声，\", \"花落知多少。\"]",
                "春天的夜晚睡得很香甜，不知不觉天就亮了。醒来时到处都能听到鸟儿的啼叫声。回想起昨天夜里的风雨声，不知道有多少花儿被打落了。",
                "①晓：天亮。②闻：听到。③啼鸟：鸟啼，鸟儿鸣叫。",
                "这首诗描写了春天早晨的景色，表达了诗人对春天的喜爱之情。全诗语言清新自然，意境优美，是描写春景的名篇。",
                "[\"春天\", \"写景\", \"田园\"]"),
                
            createPoem("静夜思", "唐", "李白",
                "[\"床前明月光，\", \"疑是地上霜。\", \"举头望明月，\", \"低头思故乡。\"]",
                "明亮的月光洒在床前，好像地上铺了一层白霜。我抬头望着天上的明月，不由得低头思念起故乡来。",
                "①疑：怀疑。②举头：抬头。",
                "这首诗写的是在寂静的月夜思念家乡的感受。诗的前两句写景，后两句抒情，语言朴素而感情真挚，是千古传诵的思乡名篇。",
                "[\"思乡\", \"月亮\", \"抒情\"]"),
                
            createPoem("登鹳雀楼", "唐", "王之涣",
                "[\"白日依山尽，\", \"黄河入海流。\", \"欲穷千里目，\", \"更上一层楼。\"]",
                "夕阳依傍着西山慢慢落下，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。",
                "①鹳雀楼：旧址在今山西永济县。②穷：尽，使达到极点。",
                "这首诗写诗人在登高望远中表现出来的不凡的胸襟抱负，反映了盛唐时期人们积极向上的进取精神。后两句富含哲理，成为千古名句。",
                "[\"哲理\", \"山水\", \"励志\"]"),
                
            createPoem("江雪", "唐", "柳宗元",
                "[\"千山鸟飞绝，\", \"万径人踪灭。\", \"孤舟蓑笠翁，\", \"独钓寒江雪。\"]",
                "所有的山上，飞鸟的身影已经绝迹，所有的小路，人的踪迹也没有了。江面孤舟上，一位披戴着蓑笠的老翁，独自在大雪覆盖的寒冷江面上垂钓。",
                "①绝：无，没有。②万径：虚指，指千万条路。③蓑笠：蓑衣和斗笠。",
                "这首诗描绘了一幅寄兴高洁、寓意丰富的寒江独钓图。诗中\"孤舟蓑笠翁\"的形象，正是诗人清高孤傲、不愿与世俗同流合污的性格写照。",
                "[\"冬天\", \"写景\", \"孤独\"]"),
                
            createPoem("水调歌头", "宋", "苏轼",
                "[\"明月几时有？把酒问青天。\", \"不知天上宫阙，今夕是何年。\", \"我欲乘风归去，又恐琼楼玉宇，\", \"高处不胜寒。\", \"起舞弄清影，何似在人间。\", \"转朱阁，低绮户，照无眠。\", \"不应有恨，何事长向别时圆？\", \"人有悲欢离合，月有阴晴圆缺，\", \"此事古难全。\", \"但愿人长久，千里共婵娟。\"]",
                "明月从什么时候才开始出现的？我端起酒杯遥问苍天。不知道在天上的宫殿，今天晚上是何年何月。我想要乘御清风回到天上，又恐怕在美玉砌成的楼宇，受不住高耸九天的寒冷。翩翩起舞玩赏着月下清影，哪像是在人间。月儿转过朱红色的楼阁，低低地挂在雕花的窗户上，照着没有睡意的人。明月不该对人们有什么怨恨吧，为什么偏在人们离别时才圆呢？人有悲欢离合的变迁，月有阴晴圆缺的转换，这种事自古来难以周全。只希望这世上所有人的亲人能平安健康，即便相隔千里，也能共享这美好的月光。",
                "①宫阙：宫殿。②归去：回到天上去。③琼楼玉宇：美玉砌成的楼宇。④婵娟：指月亮。",
                "这首词是中秋望月怀人之作，表达了对胞弟苏辙的无限思念。词人运用形象的描绘和浪漫主义的想象，紧紧围绕中秋之月展开描写、抒情和议论，从天上与人间、月与人、空间与时间这些相联系的范畴进行思考，把人世间的悲欢离合之情纳入对宇宙人生的哲理性追寻之中。",
                "[\"中秋\", \"月亮\", \"哲理\", \"豪放\"]")
        );
        
        for (Poem poem : mockPoems) {
            poemMapper.insert(poem);
        }
        
        System.out.println("初始化完成，共添加 " + mockPoems.size() + " 首诗词");
        } catch (Exception e) {
            System.err.println("诗词数据初始化失败（不影响应用启动）: " + e.getMessage());
        }
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
