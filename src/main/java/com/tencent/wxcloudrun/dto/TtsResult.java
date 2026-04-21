package com.tencent.wxcloudrun.dto;

import lombok.Data;

@Data
public class TtsResult {
    private String provider;
    private String voice;
    private String contentType;
    private String fileExtension;
    private String audioBase64;
}
