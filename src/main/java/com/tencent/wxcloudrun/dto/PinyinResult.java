package com.tencent.wxcloudrun.dto;

import lombok.Data;

import java.util.List;

@Data
public class PinyinResult {
    private String original;
    private List<PinyinChar> chars;

    @Data
    public static class PinyinChar {
        private String ch;
        private String pinyin;

        public PinyinChar(String ch, String pinyin) {
            this.ch = ch;
            this.pinyin = pinyin;
        }
    }
}
