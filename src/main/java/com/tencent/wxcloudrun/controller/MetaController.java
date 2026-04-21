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
            return ApiResponse.success(metaService.getDynastyList());
        } catch (Exception e) {
            return ApiResponse.error("获取朝代列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/authors")
    public ApiResponse<List<Map<String, Object>>> getAuthors(@RequestParam(required = false) String dynasty) {
        try {
            return ApiResponse.success(metaService.getAuthorList(dynasty));
        } catch (Exception e) {
            return ApiResponse.error("获取作者列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> getConfig() {
        try {
            return ApiResponse.success(metaService.getAppConfig());
        } catch (Exception e) {
            return ApiResponse.error("获取配置失败: " + e.getMessage());
        }
    }
}
