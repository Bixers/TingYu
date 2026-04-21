package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.model.User;
import com.tencent.wxcloudrun.service.AuthTokenService;
import com.tencent.wxcloudrun.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthTokenService authTokenService;

    @GetMapping("/profile")
    public ApiResponse<User> getProfile(HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            User user = userService.ensureUser(openId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            User user = userService.ensureUser(openId);
            AuthTokenService.AuthSession session = authTokenService.buildSession(user);
            Map<String, Object> result = new HashMap<>();
            result.put("user", session.getUser());
            result.put("token", session.getToken());
            result.put("expireAt", session.getExpireAt());
            return ApiResponse.success("登录成功", result);
        } catch (Exception e) {
            return ApiResponse.error("登录失败: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            String nickname = body == null ? null : body.get("nickname");
            String avatarUrl = body == null ? null : body.get("avatarUrl");
            User user = userService.registerOrUpdate(openId, nickname, avatarUrl);
            AuthTokenService.AuthSession session = authTokenService.buildSession(user);
            Map<String, Object> result = new HashMap<>();
            result.put("user", session.getUser());
            result.put("token", session.getToken());
            result.put("expireAt", session.getExpireAt());
            return ApiResponse.success("注册成功", result);
        } catch (Exception e) {
            return ApiResponse.error("注册失败: " + e.getMessage());
        }
    }

    @PostMapping("/rain-push")
    public ApiResponse<User> updateRainPush(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String openId = request.getHeader("X-WX-OPENID");
            if (openId == null || openId.isEmpty()) {
                return ApiResponse.error(401, "未获取到用户身份");
            }
            Object enabledValue = body.get("enabled");
            boolean enabled = enabledValue instanceof Boolean
                    ? (Boolean) enabledValue
                    : "true".equalsIgnoreCase(String.valueOf(enabledValue))
                    || "1".equals(String.valueOf(enabledValue));
            User user = userService.updateRainPushEnabled(openId, enabled);
            if (user == null) {
                return ApiResponse.notFound("用户不存在");
            }
            return ApiResponse.success("更新成功", user);
        } catch (Exception e) {
            return ApiResponse.error("更新雨丝设置失败: " + e.getMessage());
        }
    }
}
