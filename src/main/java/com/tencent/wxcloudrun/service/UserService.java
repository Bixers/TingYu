package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public User getUserByOpenId(String openId) {
        return userMapper.findByOpenId(openId);
    }

    public User ensureUser(String openId) {
        User existing = userMapper.findByOpenId(openId);
        if (existing != null) {
            return existing;
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setId("user_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        user.setOpenId(openId);
        user.setNickname("听雨客");
        user.setAvatarUrl("");
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
        String safeAvatarUrl = avatarUrl == null ? "" : avatarUrl.trim();

        if (existing != null) {
            if (!safeNickname.isEmpty()) {
                existing.setNickname(safeNickname);
            } else if (existing.getNickname() == null || existing.getNickname().trim().isEmpty()) {
                existing.setNickname("听雨客");
            }
            existing.setAvatarUrl(safeAvatarUrl);
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
        user.setNickname(safeNickname.isEmpty() ? "听雨客" : safeNickname);
        user.setAvatarUrl(safeAvatarUrl);
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
}
