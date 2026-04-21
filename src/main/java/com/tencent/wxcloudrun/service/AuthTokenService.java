package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthTokenService {

    private static final String HMAC_ALG = "HmacSHA256";

    @Value("${token.app.secret:tingyu-auth-secret}")
    private String secret;

    @Value("${token.app.expireMinutes:10080}")
    private long expireMinutes;

    public AuthSession buildSession(User user) {
        String token = createToken(user);
        long expireAt = System.currentTimeMillis() + expireMinutes * 60_000L;
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setToken(token);
        session.setExpireAt(expireAt);
        return session;
    }

    public String createToken(User user) {
        long now = System.currentTimeMillis();
        long exp = now + expireMinutes * 60_000L;

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("openId", user.getOpenId());
        payload.put("userId", user.getId());
        payload.put("nickname", user.getNickname());
        payload.put("iat", now / 1000L);
        payload.put("exp", exp / 1000L);

        String headerPart = base64Url(json(header));
        String payloadPart = base64Url(json(payload));
        String content = headerPart + "." + payloadPart;
        String sign = base64Url(hmac(content));
        return content + "." + sign;
    }

    private byte[] hmac(String content) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALG));
            return mac.doFinal(content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("生成登录令牌失败: " + e.getMessage(), e);
        }
    }

    private String json(Map<String, Object> data) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!first) {
                sb.append(",");
            }
            first = false;
            sb.append("\"").append(escape(entry.getKey())).append("\":");
            Object value = entry.getValue();
            if (value == null) {
                sb.append("null");
            } else if (value instanceof Number || value instanceof Boolean) {
                sb.append(value);
            } else {
                sb.append("\"").append(escape(String.valueOf(value))).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    public static class AuthSession {
        private User user;
        private String token;
        private long expireAt;

        public User getUser() {
            return user;
        }

        public void setUser(User user) {
            this.user = user;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public long getExpireAt() {
            return expireAt;
        }

        public void setExpireAt(long expireAt) {
            this.expireAt = expireAt;
        }
    }
}
