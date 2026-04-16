package com.tencent.wxcloudrun.model;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 诗词实体类
 */
@Data
public class Poem {

    private String id;
    private String title;
    private String dynasty;
    private String author;
    private String content;
    private String annotation;
    private String appreciation;
    private String translation;
    private String tags;
    private String source;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
