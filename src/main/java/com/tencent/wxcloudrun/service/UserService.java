package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class UserService {

    private static final String FIXED_AVATAR_URL = "/images/icon.png";

    @Autowired
    private UserMapper userMapper;

    public User getUserByOpenId(String openId) {
        return userMapper.findByOpenId(openId);
    }

    public User ensureUser(String openId) {
        User existing = userMapper.findByOpenId(openId);
        if (existing != null) {
            normalizeUser(existing);
            userMapper.update(existing);
            return existing;
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setId("user_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        user.setOpenId(openId);
        user.setNickname(buildNickname());
        user.setAvatarUrl(FIXED_AVATAR_URL);
        user.setRainPushEnabled(Boolean.FALSE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);
        return userMapper.findByOpenId(openId);
    }

    public User registerOrUpdate(String openId, String nickname, String avatarUrl) {
        User existing = userMapper.findByOpenId(openId);
        LocalDateTime now = LocalDateTime.now();
        String safeNickname = nickname == null ? "" : nickname.trim();

        if (existing != null) {
            normalizeUser(existing);
            if (existing.getRainPushEnabled() == null) {
                existing.setRainPushEnabled(Boolean.FALSE);
            }
            existing.setUpdatedAt(now);
            userMapper.update(existing);
            return userMapper.findByOpenId(openId);
        }

        User user = new User();
        user.setId("user_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        user.setOpenId(openId);
        user.setNickname(buildNickname());
        user.setAvatarUrl(FIXED_AVATAR_URL);
        user.setRainPushEnabled(Boolean.FALSE);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);
        return userMapper.findByOpenId(openId);
    }

    public User updateRainPushEnabled(String openId, boolean enabled) {
        User existing = userMapper.findByOpenId(openId);
        if (existing == null) {
            return null;
        }
        existing.setRainPushEnabled(enabled);
        existing.setUpdatedAt(LocalDateTime.now());
        userMapper.update(existing);
        return userMapper.findByOpenId(openId);
    }

    private void normalizeUser(User user) {
        if (user == null) {
            return;
        }
        if (user.getNickname() == null || !user.getNickname().matches("^听雨客\\d{4}$")) {
            user.setNickname(buildNickname());
        }
        if (user.getAvatarUrl() == null || !FIXED_AVATAR_URL.equals(user.getAvatarUrl().trim())) {
            user.setAvatarUrl(FIXED_AVATAR_URL);
        }
    }

    private String buildNickname() {
        int value = new Random().nextInt(10000);
        return String.format("听雨客%04d", value);
    }
}
