package com.tencent.wxcloudrun.model;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 作者实体类
 */
@Data
public class Author {

    private String id;
    private String name;
    private String dynasty;
    private String description;
    private Integer birthYear;
    private Integer deathYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
