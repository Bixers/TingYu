package com.tencent.wxcloudrun.dto;

import lombok.Data;

@Data
public class RhymeResult {
    private String text;
    private String targetChar;
    private String pinyin;
    private String pingshui;
    private String cilin;
    private String note;
}
