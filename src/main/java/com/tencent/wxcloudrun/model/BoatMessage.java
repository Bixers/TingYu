package com.tencent.wxcloudrun.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BoatMessage {

    private String id;
    private String userId;
    private String content;
    private String signature;
    private String parentMessageId;
    private Integer replyCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

