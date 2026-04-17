package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.PageResult;
import com.tencent.wxcloudrun.model.Poem;
import com.tencent.wxcloudrun.service.PoemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/poems")
@CrossOrigin(origins = "*")
public class PoemController {

    @Autowired
    private PoemService poemService;

    @GetMapping("/daily")
    public ApiResponse<Poem> getDailyPoem() {
        try {
            Poem poem = poemService.getDailyPoem();
            if (poem == null) {
                return ApiResponse.notFound("暂无诗词数据");
            }
            return ApiResponse.success(poem);
        } catch (Exception e) {
            return ApiResponse.error("获取失败: " + e.getMessage());
        }
    }

    @GetMapping("/random")
    public ApiResponse<Poem> getRandomPoem(@RequestParam(required = false) String excludeIds) {
        try {
            Poem poem = poemService.getRandomPoem(excludeIds);
            if (poem == null) {
                return ApiResponse.notFound("暂无诗词数据");
            }
            return ApiResponse.success(poem);
        } catch (Exception e) {
            return ApiResponse.error("获取失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Poem> getPoemById(@PathVariable String id) {
        try {
            Poem poem = poemService.getPoemById(id);
            if (poem == null) {
                return ApiResponse.notFound("诗词不存在");
            }
            return ApiResponse.success(poem);
        } catch (Exception e) {
            return ApiResponse.error("获取失败: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<Poem>> getPoemList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String dynasty,
            @RequestParam(required = false) String tag) {
        try {
            PageResult<Poem> result = poemService.getPoemList(page, pageSize, keyword, dynasty, tag);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("获取失败: " + e.getMessage());
        }
    }

    @PostMapping("/search")
    public ApiResponse<PageResult<Poem>> searchPoems(@RequestBody Map<String, Object> params) {
        try {
            String keyword = (String) params.get("keyword");
            Integer page = params.get("page") != null ? (Integer) params.get("page") : 1;
            Integer pageSize = params.get("pageSize") != null ? (Integer) params.get("pageSize") : 10;

            PageResult<Poem> result = poemService.searchPoems(keyword, page, pageSize);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("搜索失败: " + e.getMessage());
        }
    }
}
