package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dto.PinyinResult;
import net.sourceforge.pinyin4j.PinyinHelper;
import net.sourceforge.pinyin4j.format.HanyuPinyinCaseType;
import net.sourceforge.pinyin4j.format.HanyuPinyinOutputFormat;
import net.sourceforge.pinyin4j.format.HanyuPinyinToneType;
import net.sourceforge.pinyin4j.format.HanyuPinyinVCharType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PinyinService {

    private final HanyuPinyinOutputFormat format;

    public PinyinService() {
        format = new HanyuPinyinOutputFormat();
        format.setCaseType(HanyuPinyinCaseType.LOWERCASE);
        format.setToneType(HanyuPinyinToneType.WITH_TONE_MARK);
        format.setVCharType(HanyuPinyinVCharType.WITH_U_UNICODE);
    }

    public PinyinResult convertToPinyin(String text) {
        PinyinResult result = new PinyinResult();
        result.setOriginal(text);

        List<PinyinResult.PinyinChar> chars = new ArrayList<>();
        for (char c : text.toCharArray()) {
            String ch = String.valueOf(c);
            String pinyin = "";

            if (Character.toString(c).matches("[\\u4e00-\\u9fa5]")) {
                try {
                    String[] pinyinArray = PinyinHelper.toHanyuPinyinStringArray(c, format);
                    if (pinyinArray != null && pinyinArray.length > 0) {
                        pinyin = pinyinArray[0];
                    }
                } catch (Exception e) {
                    // 转换失败则保持空拼音
                }
            }

            chars.add(new PinyinResult.PinyinChar(ch, pinyin));
        }

        result.setChars(chars);
        return result;
    }
}
