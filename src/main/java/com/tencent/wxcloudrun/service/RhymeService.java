package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dto.RhymeResult;
import net.sourceforge.pinyin4j.PinyinHelper;
import net.sourceforge.pinyin4j.format.HanyuPinyinCaseType;
import net.sourceforge.pinyin4j.format.HanyuPinyinOutputFormat;
import net.sourceforge.pinyin4j.format.HanyuPinyinToneType;
import net.sourceforge.pinyin4j.format.HanyuPinyinVCharType;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RhymeService {

    private final HanyuPinyinOutputFormat format;
    private final Map<String, String[]> rhymeMap = new HashMap<>();

    public RhymeService() {
        format = new HanyuPinyinOutputFormat();
        format.setCaseType(HanyuPinyinCaseType.LOWERCASE);
        format.setToneType(HanyuPinyinToneType.WITHOUT_TONE);
        format.setVCharType(HanyuPinyinVCharType.WITH_U_UNICODE);

        rhymeMap.put("a", new String[]{"麻韵", "词林正韵·第十部", "开口大、音色明亮，通常归入近似麻部。"});
        rhymeMap.put("ai", new String[]{"佳韵", "词林正韵·第三部", "韵腹为 ai 类音，读感较为开阔。"});
        rhymeMap.put("an", new String[]{"寒韵", "词林正韵·第七部", "常见闭口鼻音，归入 an 系。"});
        rhymeMap.put("ang", new String[]{"唐韵", "词林正韵·第十一部", "韵尾为 -ng，常见于唐韵相关字。"});
        rhymeMap.put("e", new String[]{"歌韵", "词林正韵·第九部", "中元音收束，通常归入 e 系。"});
        rhymeMap.put("ei", new String[]{"微韵", "词林正韵·第三部", "带有细窄收束感，偏微韵参考。"});
        rhymeMap.put("en", new String[]{"真韵", "词林正韵·第八部", "鼻音收尾，归入 en 系。"});
        rhymeMap.put("eng", new String[]{"庚韵", "词林正韵·第十一部", "常见于庚青类收尾。"});
        rhymeMap.put("i", new String[]{"支韵", "词林正韵·第二部", "细长高元音，取支韵参考。"});
        rhymeMap.put("in", new String[]{"真韵", "词林正韵·第八部", "前鼻音收尾，归入 in 系。"});
        rhymeMap.put("ing", new String[]{"青韵", "词林正韵·第十一部", "前鼻音韵尾，偏青庚组。"});
        rhymeMap.put("o", new String[]{"歌韵", "词林正韵·第九部", "开口度较大，归歌韵参考。"});
        rhymeMap.put("ong", new String[]{"东韵", "词林正韵·第一部", "古典诗词常见的东冬系统。"});
        rhymeMap.put("ou", new String[]{"尤韵", "词林正韵·第六部", "复元音收束，参考尤韵。"});
        rhymeMap.put("u", new String[]{"鱼韵", "词林正韵·第四部", "高圆唇元音，取鱼韵参考。"});
        rhymeMap.put("uan", new String[]{"元韵", "词林正韵·第六部", "韵腹较圆，归元韵参考。"});
        rhymeMap.put("ue", new String[]{"月韵", "词林正韵·第十五部", "前元音收束，偏月韵参考。"});
        rhymeMap.put("un", new String[]{"文韵", "词林正韵·第八部", "前鼻音收尾，归文韵参考。"});
    }

    public RhymeResult lookup(String text) {
        String clean = normalize(text);
        if (clean.isEmpty()) {
            throw new IllegalArgumentException("文本不能为空");
        }

        String targetChar = extractTargetChar(clean);
        String pinyin = toPinyin(targetChar);
        String finals = extractFinals(pinyin);
        String[] info = rhymeMap.get(finals);

        RhymeResult result = new RhymeResult();
        result.setText(clean);
        result.setTargetChar(targetChar);
        result.setPinyin(pinyin);
        if (info != null) {
            result.setPingshui("平水韵参考：" + info[0]);
            result.setCilin(info[1]);
            result.setNote(info[2]);
        } else {
            result.setPingshui("暂未收录");
            result.setCilin("暂未收录");
            result.setNote("当前版本只提供常见字的韵部参考，后续可接入完整《平水韵》数据表。");
        }
        return result;
    }

    private String normalize(String text) {
        if (text == null) return "";
        return text.replace("\r", "").replace("\n", "").trim();
    }

    private String extractTargetChar(String text) {
        for (int i = text.length() - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (Character.toString(c).matches("[\\u4e00-\\u9fa5]")) {
                return String.valueOf(c);
            }
        }
        return String.valueOf(text.charAt(text.length() - 1));
    }

    private String toPinyin(String ch) {
        if (ch == null || ch.isEmpty()) return "";
        char c = ch.charAt(0);
        try {
            String[] arr = PinyinHelper.toHanyuPinyinStringArray(c, format);
            if (arr != null && arr.length > 0) {
                return arr[0];
            }
        } catch (Exception e) {
            // ignore
        }
        return "";
    }

    private String extractFinals(String pinyin) {
        if (pinyin == null) return "";
        String base = pinyin.toLowerCase();
        base = base.replace("zh", "z").replace("ch", "c").replace("sh", "s");
        base = base.replaceAll("[0-9]", "");
        if (base.endsWith("iang")) return "ang";
        if (base.endsWith("uang")) return "ang";
        if (base.endsWith("iong")) return "ong";
        if (base.endsWith("uai")) return "ai";
        if (base.endsWith("iao")) return "ao";
        if (base.endsWith("ian")) return "an";
        if (base.endsWith("uan")) return "uan";
        if (base.endsWith("ing")) return "ing";
        if (base.endsWith("eng")) return "eng";
        if (base.endsWith("ong")) return "ong";
        if (base.endsWith("ai")) return "ai";
        if (base.endsWith("ei")) return "ei";
        if (base.endsWith("ao")) return "ao";
        if (base.endsWith("ou")) return "ou";
        if (base.endsWith("an")) return "an";
        if (base.endsWith("en")) return "en";
        if (base.endsWith("in")) return "in";
        if (base.endsWith("un")) return "un";
        if (base.endsWith("ue")) return "ue";
        if (base.endsWith("uo")) return "o";
        if (base.endsWith("e")) return "e";
        if (base.endsWith("a")) return "a";
        if (base.endsWith("i")) return "i";
        if (base.endsWith("o")) return "o";
        if (base.endsWith("u")) return "u";
        return base;
    }
}
