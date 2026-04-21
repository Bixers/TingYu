package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.UsageSummary;
import com.tencent.wxcloudrun.service.UserActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/usage")
@CrossOrigin(origins = "*")
public class UsageController {

    @Autowired
    private UserActivityService userActivityService;

    @PostMapping("/track")
    public ApiResponse<Void> track(@RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String type = body.get("type");
            if ("POEM_VIEW".equalsIgnoreCase(type)) {
                userActivityService.recordPoemView(openId);
            } else if ("SEARCH".equalsIgnoreCase(type)) {
                userActivityService.recordSearch(openId);
            } else if ("EXCERPT".equalsIgnoreCase(type)) {
                userActivityService.recordExcerpt(openId);
            } else if ("FAVORITE".equalsIgnoreCase(type)) {
                userActivityService.recordFavorite(openId);
            }
            return ApiResponse.success("ok", null);
        } catch (Exception e) {
            return ApiResponse.error("记录失败: " + e.getMessage());
        }
    }

    @GetMapping("/summary")
    public ApiResponse<UsageSummary> summary(HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(userActivityService.buildSummary(openId));
        } catch (Exception e) {
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }
}
