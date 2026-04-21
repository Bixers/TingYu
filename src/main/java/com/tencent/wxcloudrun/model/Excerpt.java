package com.tencent.wxcloudrun.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Excerpt {

    private String id;
    private String userId;
    private String poemId;
    private Integer sentenceIndex;
    private String sentenceText;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String poemTitle;
    private String poemDynasty;
    private String poemAuthor;
    private String poemContent;
    private String poemTags;
}
