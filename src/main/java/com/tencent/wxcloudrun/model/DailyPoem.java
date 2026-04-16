package com.tencent.wxcloudrun.model;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 每日推荐诗词实体类
 */
@Data
public class DailyPoem {

    private String id;
    private String poemId;
    private String date;
    private LocalDateTime createdAt;
    
    // 关联诗词
    private Poem poem;
}
