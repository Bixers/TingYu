package com.tencent.wxcloudrun.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.model.Poem;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DailyRainPushService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<Map<String, Object>>() {};

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PoemService poemService;

    @Value("${wechat.appid:}")
    private String appId;

    @Value("${wechat.secret:}")
    private String appSecret;

    @Value("${wechat.subscribe.template-id:}")
    private String templateId;

    @Value("${wechat.subscribe.page:pages/detail/index}")
    private String page;

    private volatile String accessToken;
    private volatile long accessTokenExpireAt;

    @Scheduled(cron = "0 0 10 * * ?", zone = "Asia/Shanghai")
    public void pushDailyRain() {
        if (!isConfigured()) {
            System.out.println("每日雨丝推送未配置 appid/secret/template-id，跳过执行");
            return;
        }

        List<User> users = userMapper.findRainPushEnabledUsers();
        if (users == null || users.isEmpty()) {
            return;
        }

        Poem poem = poemService.getDailyPoem();
        if (poem == null) {
            return;
        }

        for (User user : users) {
            try {
                sendOne(user, poem);
            } catch (Exception e) {
                System.err.println("推送每日雨丝失败 openId=" + user.getOpenId() + ": " + e.getMessage());
            }
        }
    }

    public void sendOne(User user, Poem poem) {
        if (user == null || !notBlank(user.getOpenId()) || poem == null) {
            return;
        }
        if (!isConfigured()) {
            return;
        }

        String token = getAccessToken();
        if (!notBlank(token)) {
            return;
        }

        String url = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=" + token;

        Map<String, Object> payload = new HashMap<>();
        payload.put("touser", user.getOpenId());
        payload.put("template_id", templateId);
        payload.put("page", page + "?id=" + poem.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("thing1", wrapValue(safeValue(getFeaturedSentence(poem), 20)));
        data.put("thing2", wrapValue(safeValue(poem.getAuthor(), 20)));
        data.put("thing3", wrapValue(safeValue(poem.getTitle(), 20)));
        data.put("thing4", wrapValue(safeValue(buildCategory(poem), 20)));
        payload.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        Map<String, Object> body = parseJsonObject(response.getBody(), "subscribe send");
        Object errcode = body.get("errcode");
        if (errcode != null && Integer.parseInt(String.valueOf(errcode)) != 0) {
            throw new IllegalStateException("微信返回错误: " + body);
        }
    }

    private String getAccessToken() {
        long now = System.currentTimeMillis();
        if (accessToken != null && now < accessTokenExpireAt - 60_000) {
            return accessToken;
        }

        String url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential"
                + "&appid=" + appId
                + "&secret=" + appSecret;
        String responseText = restTemplate.getForObject(url, String.class);
        Map<String, Object> response = parseJsonObject(responseText, "access token");
        if (response.isEmpty()) {
            return null;
        }

        Object token = response.get("access_token");
        Object expiresIn = response.get("expires_in");
        if (token == null || expiresIn == null) {
            Object errcode = response.get("errcode");
            Object errmsg = response.get("errmsg");
            if (errcode != null || errmsg != null) {
                throw new IllegalStateException("获取 access_token 失败: " + response);
            }
            return null;
        }

        accessToken = String.valueOf(token);
        accessTokenExpireAt = now + Long.parseLong(String.valueOf(expiresIn)) * 1000L;
        return accessToken;
    }

    private boolean isConfigured() {
        return notBlank(appId) && notBlank(appSecret) && notBlank(templateId);
    }

    private boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String getFeaturedSentence(Poem poem) {
        if (poem == null || poem.getContent() == null) {
            return "";
        }
        try {
            List<?> lines = OBJECT_MAPPER.readValue(poem.getContent(), List.class);
            if (lines != null && !lines.isEmpty()) {
                return String.valueOf(lines.get(0));
            }
        } catch (Exception ignore) {
            // fall back to raw text
        }

        String content = poem.getContent();
        int split = content.indexOf('。');
        if (split >= 0) {
            return content.substring(0, split + 1);
        }
        return content;
    }

    private String buildCategory(Poem poem) {
        StringBuilder builder = new StringBuilder("古诗文");
        if (poem == null || poem.getTags() == null || poem.getTags().trim().isEmpty()) {
            return builder.toString();
        }

        try {
            List<?> tags = OBJECT_MAPPER.readValue(poem.getTags(), List.class);
            if (tags != null && !tags.isEmpty()) {
                builder.append("-").append(String.valueOf(tags.get(0)));
            }
            if (tags != null && tags.size() > 1) {
                builder.append("-").append(String.valueOf(tags.get(1)));
            }
        } catch (Exception ignore) {
            // keep fallback category
        }
        return builder.toString();
    }

    private String safeValue(String value, int limit) {
        if (value == null) {
            return "";
        }
        String clean = value.trim();
        if (clean.length() > limit) {
            return clean.substring(0, limit);
        }
        return clean;
    }

    private Map<String, String> wrapValue(String value) {
        Map<String, String> item = new HashMap<>();
        item.put("value", value == null ? "" : value);
        return item;
    }

    private Map<String, Object> parseJsonObject(String responseText, String scene) {
        if (!notBlank(responseText)) {
            return new HashMap<>();
        }
        try {
            return OBJECT_MAPPER.readValue(responseText, MAP_TYPE);
        } catch (Exception e) {
            throw new IllegalStateException("微信 " + scene + " 响应不是合法 JSON: " + responseText, e);
        }
    }
}
