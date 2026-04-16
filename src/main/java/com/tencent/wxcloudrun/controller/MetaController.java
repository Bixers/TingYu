package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.service.MetaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meta")
@CrossOrigin(origins = "*")
public class MetaController {

    @Autowired
    private MetaService metaService;

    @GetMapping("/dynasties")
    public ApiResponse<List<Map<String, Object>>> getDynasties() {
        try {
            List<Map<String, Object>> dynasties = metaService.getDynastyList();
            return ApiResponse.success(dynasties);
        } catch (Exception e) {
            return ApiResponse.error("获取朝代列表失败：" + e.getMessage());
        }
    }

    @GetMapping("/authors")
    public ApiResponse<List<Map<String, Object>>> getAuthors(
            @RequestParam(required = false) String dynasty) {
        try {
            List<Map<String, Object>> authors = metaService.getAuthorList(dynasty);
            return ApiResponse.success(authors);
        } catch (Exception e) {
            return ApiResponse.error("获取作者列表失败：" + e.getMessage());
        }
    }
}
