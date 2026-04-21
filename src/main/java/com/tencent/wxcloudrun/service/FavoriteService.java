package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.FavoriteMapper;
import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.dto.FavoriteActionResult;
import com.tencent.wxcloudrun.dto.FavoriteStatus;
import com.tencent.wxcloudrun.model.Favorite;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FavoriteService {

    private static final String TYPE_FULL = "FULL";
    private static final String TYPE_SENTENCE = "SENTENCE";

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Autowired
    private UserMapper userMapper;

    public List<Favorite> listFavorites(String openId, String favoriteType) {
        User user = requireUser(openId);
        if (user == null) {
            return java.util.Collections.emptyList();
        }
        String type = normalizeFavoriteType(favoriteType);
        return favoriteMapper.findByUserId(user.getId(), type);
    }

    public FavoriteStatus getFavoriteStatus(String openId, String poemId, Integer sentenceIndex) {
        User user = requireUser(openId);
        FavoriteStatus status = new FavoriteStatus();
        if (user == null || poemId == null || poemId.trim().isEmpty()) {
            return status;
        }

        Favorite full = favoriteMapper.findByUserIdAndTypeAndTargetKey(user.getId(), TYPE_FULL, poemId.trim());
        status.setFullCollected(full != null);
        status.setFullFavoriteId(full != null ? full.getId() : null);

        if (sentenceIndex != null) {
            Favorite sentence = favoriteMapper.findByUserIdAndTypeAndTargetKey(
                    user.getId(), TYPE_SENTENCE, buildSentenceTargetKey(poemId, sentenceIndex));
            status.setSentenceCollected(sentence != null);
            status.setSentenceFavoriteId(sentence != null ? sentence.getId() : null);
        }

        return status;
    }

    public FavoriteActionResult toggleFullFavorite(String openId, String poemId) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("链路中未找到用户");
        }
        if (poemId == null || poemId.trim().isEmpty()) {
            throw new IllegalArgumentException("诗词ID不能为空");
        }

        String targetKey = poemId.trim();
        Favorite existing = favoriteMapper.findByUserIdAndTypeAndTargetKey(user.getId(), TYPE_FULL, targetKey);
        FavoriteActionResult result = new FavoriteActionResult();
        if (existing != null) {
            favoriteMapper.deleteById(existing.getId());
            result.setCollected(false);
            result.setFavorite(existing);
            return result;
        }

        Favorite favorite = createFavorite(user.getId(), TYPE_FULL, poemId.trim(), targetKey, null, null);
        favoriteMapper.insert(favorite);
        result.setCollected(true);
        result.setFavorite(favoriteMapper.findById(favorite.getId()));
        return result;
    }

    public FavoriteActionResult toggleSentenceFavorite(String openId, String poemId, Integer sentenceIndex, String sentenceText) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("链路中未找到用户");
        }
        if (poemId == null || poemId.trim().isEmpty()) {
            throw new IllegalArgumentException("诗词ID不能为空");
        }
        if (sentenceIndex == null || sentenceIndex < 0) {
            throw new IllegalArgumentException("句子序号不能为空");
        }

        String cleanText = sentenceText == null ? "" : sentenceText.trim();
        if (cleanText.isEmpty()) {
            throw new IllegalArgumentException("句子内容不能为空");
        }

        String targetKey = buildSentenceTargetKey(poemId, sentenceIndex);
        Favorite existing = favoriteMapper.findByUserIdAndTypeAndTargetKey(user.getId(), TYPE_SENTENCE, targetKey);
        FavoriteActionResult result = new FavoriteActionResult();
        if (existing != null) {
            favoriteMapper.deleteById(existing.getId());
            result.setCollected(false);
            result.setFavorite(existing);
            return result;
        }

        Favorite favorite = createFavorite(user.getId(), TYPE_SENTENCE, poemId.trim(), targetKey, sentenceIndex, cleanText);
        favoriteMapper.insert(favorite);
        result.setCollected(true);
        result.setFavorite(favoriteMapper.findById(favorite.getId()));
        return result;
    }

    public void deleteFavorite(String openId, String favoriteId) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("链路中未找到用户");
        }
        Favorite favorite = favoriteMapper.findById(favoriteId);
        if (favorite == null || !user.getId().equals(favorite.getUserId())) {
            throw new IllegalArgumentException("收藏不存在");
        }
        favoriteMapper.deleteById(favoriteId);
    }

    private Favorite createFavorite(String userId, String favoriteType, String poemId, String targetKey,
                                    Integer sentenceIndex, String sentenceText) {
        LocalDateTime now = LocalDateTime.now();
        Favorite favorite = new Favorite();
        favorite.setId("fav_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        favorite.setUserId(userId);
        favorite.setFavoriteType(favoriteType);
        favorite.setPoemId(poemId);
        favorite.setTargetKey(targetKey);
        favorite.setSentenceIndex(sentenceIndex);
        favorite.setSentenceText(sentenceText);
        favorite.setCreatedAt(now);
        favorite.setUpdatedAt(now);
        return favorite;
    }

    private User requireUser(String openId) {
        if (openId == null || openId.trim().isEmpty()) {
            return null;
        }
        return userMapper.findByOpenId(openId);
    }

    private String normalizeFavoriteType(String favoriteType) {
        if (favoriteType == null || favoriteType.trim().isEmpty()) {
            return null;
        }
        String type = favoriteType.trim().toUpperCase();
        if (TYPE_FULL.equals(type) || TYPE_SENTENCE.equals(type)) {
            return type;
        }
        return null;
    }

    private String buildSentenceTargetKey(String poemId, Integer sentenceIndex) {
        return poemId.trim() + ":" + sentenceIndex;
    }
}
