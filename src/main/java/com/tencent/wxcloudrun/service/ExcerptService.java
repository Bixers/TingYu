package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.ExcerptMapper;
import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.model.Excerpt;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ExcerptService {

    @Autowired
    private ExcerptMapper excerptMapper;

    @Autowired
    private UserMapper userMapper;

    public List<Excerpt> listExcerpts(String openId) {
        User user = requireUser(openId);
        if (user == null) {
            return java.util.Collections.emptyList();
        }
        return excerptMapper.findByUserId(user.getId());
    }

    public Excerpt saveExcerpt(String openId, String poemId, Integer sentenceIndex, String sentenceText, String note) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
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

        String cleanNote = note == null ? "" : note.trim();
        Excerpt existing = excerptMapper.findByUserIdAndPoemIdAndSentenceIndexAndSentenceText(
                user.getId(), poemId.trim(), sentenceIndex, cleanText);
        if (existing != null) {
            existing.setNote(cleanNote);
            excerptMapper.updateNote(existing.getId(), cleanNote);
            return excerptMapper.findById(existing.getId());
        }

        LocalDateTime now = LocalDateTime.now();
        Excerpt excerpt = new Excerpt();
        excerpt.setId("exc_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
        excerpt.setUserId(user.getId());
        excerpt.setPoemId(poemId.trim());
        excerpt.setSentenceIndex(sentenceIndex);
        excerpt.setSentenceText(cleanText);
        excerpt.setNote(cleanNote);
        excerpt.setCreatedAt(now);
        excerpt.setUpdatedAt(now);
        excerptMapper.insert(excerpt);
        return excerptMapper.findById(excerpt.getId());
    }

    public Excerpt updateNote(String openId, String id, String note) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("摘录ID不能为空");
        }
        Excerpt excerpt = excerptMapper.findById(id);
        if (excerpt == null || !user.getId().equals(excerpt.getUserId())) {
            throw new IllegalArgumentException("摘录不存在");
        }
        String cleanNote = note == null ? "" : note.trim();
        excerptMapper.updateNote(id, cleanNote);
        return excerptMapper.findById(id);
    }

    public void deleteExcerpt(String openId, String id) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        Excerpt excerpt = excerptMapper.findById(id);
        if (excerpt == null || !user.getId().equals(excerpt.getUserId())) {
            throw new IllegalArgumentException("摘录不存在");
        }
        excerptMapper.deleteById(id);
    }

    private User requireUser(String openId) {
        if (openId == null || openId.trim().isEmpty()) {
            return null;
        }
        return userMapper.findByOpenId(openId);
    }
}
