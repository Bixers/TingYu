package com.tencent.wxcloudrun.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserActivityDaily {

    private String id;
    private String userId;
    private LocalDate activityDate;
    private Integer poemViews;
    private Integer searchCount;
    private Integer excerptCount;
    private Integer favoriteCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

