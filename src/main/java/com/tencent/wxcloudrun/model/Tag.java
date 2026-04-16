package com.tencent.wxcloudrun.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Tag {
    private String id;
    private String name;
    private String description;
    private String category;
    private LocalDateTime createdAt;
}
