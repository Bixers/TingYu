package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.BoatThreadResult;
import com.tencent.wxcloudrun.model.BoatMessage;
import com.tencent.wxcloudrun.service.BoatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boat")
@CrossOrigin(origins = "*")
public class BoatController {

    @Autowired
    private BoatService boatService;

    @GetMapping("/messages")
    public ApiResponse<List<BoatMessage>> latest(@RequestParam(required = false) Integer limit,
                                                 HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(boatService.listLatestMessages(openId, limit));
        } catch (Exception e) {
            return ApiResponse.error("获取舟池失败: " + e.getMessage());
        }
    }

    @GetMapping("/messages/mine")
    public ApiResponse<List<BoatMessage>> mine(@RequestParam(required = false) Integer limit,
                                               HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(boatService.listMyMessages(openId, limit));
        } catch (Exception e) {
            return ApiResponse.error("获取我的诗笺失败: " + e.getMessage());
        }
    }

    @GetMapping("/messages/collected")
    public ApiResponse<List<BoatMessage>> collected(@RequestParam(required = false) Integer limit,
                                                    HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(boatService.listCollectedMessages(openId, limit));
        } catch (Exception e) {
            return ApiResponse.error("获取收藏诗笺失败: " + e.getMessage());
        }
    }

    @GetMapping("/messages/recent-received")
    public ApiResponse<List<BoatMessage>> recentReceived(@RequestParam(required = false) Integer limit,
                                                         HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success(boatService.listRecentReceivedMessages(openId, limit));
        } catch (Exception e) {
            return ApiResponse.error("获取最近收到的诗笺失败: " + e.getMessage());
        }
    }

    @GetMapping("/messages/{id}")
    public ApiResponse<BoatThreadResult> detail(@PathVariable String id, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            BoatThreadResult result = boatService.getThread(openId, id);
            if (result == null) {
                return ApiResponse.notFound("诗笺不存在");
            }
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("获取诗笺详情失败: " + e.getMessage());
        }
    }

    @PostMapping("/messages")
    public ApiResponse<BoatMessage> publish(@RequestBody Map<String, String> body,
                                            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            BoatMessage message = boatService.publishMessage(
                    openId,
                    body.get("content"),
                    body.get("signature"));
            return ApiResponse.success("投递成功", message);
        } catch (Exception e) {
            return ApiResponse.error("投递失败: " + e.getMessage());
        }
    }

    @PostMapping("/receive")
    public ApiResponse<BoatMessage> receive(HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            BoatMessage message = boatService.receiveRandom(openId);
            if (message == null) {
                return ApiResponse.notFound("暂时没有可收取的诗笺");
            }
            return ApiResponse.success(message);
        } catch (Exception e) {
            return ApiResponse.error("收取诗笺失败: " + e.getMessage());
        }
    }

    @PostMapping("/messages/{id}/collect")
    public ApiResponse<BoatMessage> collect(@PathVariable String id,
                                            HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            return ApiResponse.success("收藏成功", boatService.collectMessage(openId, id));
        } catch (Exception e) {
            return ApiResponse.error("收藏失败: " + e.getMessage());
        }
    }

    @PostMapping("/messages/{id}/reply")
    public ApiResponse<BoatThreadResult> reply(@PathVariable String id,
                                               @RequestBody Map<String, String> body,
                                               HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            BoatThreadResult result = boatService.replyMessage(
                    openId,
                    id,
                    body.get("replyText"),
                    body.get("signature"));
            return ApiResponse.success("回复成功", result);
        } catch (Exception e) {
            return ApiResponse.error("回复失败: " + e.getMessage());
        }
    }
}
