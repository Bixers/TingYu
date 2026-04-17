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

    public User registerOrUpdate(String openId, String nickname, String avatarUrl) {
        User existing = userMapper.findByOpenId(openId);
        LocalDateTime now = LocalDateTime.now();

        if (existing != null) {
            existing.setNickname(nickname);
            existing.setAvatarUrl(avatarUrl);
            existing.setUpdatedAt(now);
            userMapper.update(existing);
            return userMapper.findByOpenId(openId);
        }

        User user = new User();
        user.setId("user_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        user.setOpenId(openId);
        user.setNickname(nickname);
        user.setAvatarUrl(avatarUrl);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);
        return user;
    }
}
