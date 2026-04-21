package com.tencent.wxcloudrun.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户收藏实体
 */
@Data
public class Favorite {

    private String id;
    private String userId;
    private String favoriteType;
    private String poemId;
    private String targetKey;
    private Integer sentenceIndex;
    private String sentenceText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 列表展示字段
    private String poemTitle;
    private String poemDynasty;
    private String poemAuthor;
    private String poemContent;
    private String poemTags;
}
