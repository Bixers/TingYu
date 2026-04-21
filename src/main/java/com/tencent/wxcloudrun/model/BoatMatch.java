package com.tencent.wxcloudrun.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BoatMatch {

    private String id;
    private String userId;
    private String messageId;
    private String matchType;
    private LocalDateTime createdAt;
}

