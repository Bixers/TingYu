package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.model.Excerpt;
import com.tencent.wxcloudrun.service.ExcerptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/excerpts")
@CrossOrigin(origins = "*")
public class ExcerptController {

    @Autowired
    private ExcerptService excerptService;

    @GetMapping
    public ApiResponse<List<Excerpt>> list(HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(excerptService.listExcerpts(openId));
        } catch (Exception e) {
            return ApiResponse.error("获取摘录列表失败: " + e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Excerpt> add(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String poemId = body.get("poemId") == null ? null : String.valueOf(body.get("poemId"));
            Integer sentenceIndex = toInteger(body.get("sentenceIndex"));
            String sentenceText = body.get("sentenceText") == null ? null : String.valueOf(body.get("sentenceText"));
            String note = body.get("note") == null ? null : String.valueOf(body.get("note"));
            return ApiResponse.success(excerptService.saveExcerpt(openId, poemId, sentenceIndex, sentenceText, note));
        } catch (Exception e) {
            return ApiResponse.error("保存摘录失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Excerpt> update(@PathVariable String id,
                                       @RequestBody Map<String, Object> body,
                                       HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String note = body.get("note") == null ? null : String.valueOf(body.get("note"));
            return ApiResponse.success(excerptService.updateNote(openId, id, note));
        } catch (Exception e) {
            return ApiResponse.error("更新摘录失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            excerptService.deleteExcerpt(openId, id);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除摘录失败: " + e.getMessage());
        }
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        return Integer.valueOf(text);
    }
}
