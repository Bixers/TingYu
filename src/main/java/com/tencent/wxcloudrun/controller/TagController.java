package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.model.Tag;
import com.tencent.wxcloudrun.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = "*")
public class TagController {

    @Autowired
    private TagService tagService;

    @GetMapping
    public ApiResponse<List<Tag>> getAllTags() {
        try {
            List<Tag> tags = tagService.getAllTags();
            return ApiResponse.success(tags);
        } catch (Exception e) {
            return ApiResponse.error("获取标签失败：" + e.getMessage());
        }
    }

    @GetMapping("/grouped")
    public ApiResponse<Map<String, List<Tag>>> getTagsGrouped() {
        try {
            Map<String, List<Tag>> grouped = tagService.getTagsGrouped();
            return ApiResponse.success(grouped);
        } catch (Exception e) {
            return ApiResponse.error("获取标签分组失败：" + e.getMessage());
        }
    }
}
