package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.FavoriteActionResult;
import com.tencent.wxcloudrun.dto.FavoriteStatus;
import com.tencent.wxcloudrun.model.Favorite;
import com.tencent.wxcloudrun.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "*")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @GetMapping
    public ApiResponse<List<Favorite>> list(
            @RequestParam(required = false) String type,
            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            List<Favorite> favorites = favoriteService.listFavorites(openId, type);
            return ApiResponse.success(favorites);
        } catch (Exception e) {
            return ApiResponse.error("获取收藏列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ApiResponse<FavoriteStatus> status(
            @RequestParam String poemId,
            @RequestParam(required = false) Integer sentenceIndex,
            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            FavoriteStatus status = favoriteService.getFavoriteStatus(openId, poemId, sentenceIndex);
            return ApiResponse.success(status);
        } catch (Exception e) {
            return ApiResponse.error("获取收藏状态失败: " + e.getMessage());
        }
    }

    @PostMapping("/full/toggle")
    public ApiResponse<FavoriteActionResult> toggleFull(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String poemId = body.get("poemId");
            FavoriteActionResult result = favoriteService.toggleFullFavorite(openId, poemId);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("操作失败: " + e.getMessage());
        }
    }

    @PostMapping("/sentence/toggle")
    public ApiResponse<FavoriteActionResult> toggleSentence(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String poemId = body.get("poemId") == null ? null : String.valueOf(body.get("poemId"));
            Integer sentenceIndex = toInteger(body.get("sentenceIndex"));
            String sentenceText = body.get("sentenceText") == null ? null : String.valueOf(body.get("sentenceText"));
            FavoriteActionResult result = favoriteService.toggleSentenceFavorite(openId, poemId, sentenceIndex, sentenceText);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("操作失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable String id,
            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            favoriteService.deleteFavorite(openId, id);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除失败: " + e.getMessage());
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
