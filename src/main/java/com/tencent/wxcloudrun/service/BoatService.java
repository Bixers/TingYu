package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.BoatMatchMapper;
import com.tencent.wxcloudrun.dao.BoatMessageMapper;
import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.dto.BoatThreadResult;
import com.tencent.wxcloudrun.model.BoatMatch;
import com.tencent.wxcloudrun.model.BoatMessage;
import com.tencent.wxcloudrun.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class BoatService {

    private static final int DEFAULT_LIMIT = 20;
    private static final String MATCH_RECEIVED = "RECEIVED";
    private static final String MATCH_BOOKMARKED = "BOOKMARKED";
    private static final String MATCH_REPLIED = "REPLIED";

    @Autowired
    private BoatMessageMapper boatMessageMapper;

    @Autowired
    private BoatMatchMapper boatMatchMapper;

    @Autowired
    private UserMapper userMapper;

    public List<BoatMessage> listLatestMessages(String openId, Integer limit) {
        User user = requireUser(openId);
        if (user == null) {
            return Collections.emptyList();
        }
        return boatMessageMapper.findLatest(user.getId(), normalizeLimit(limit));
    }

    public List<BoatMessage> listMyMessages(String openId, Integer limit) {
        User user = requireUser(openId);
        if (user == null) {
            return Collections.emptyList();
        }
        return boatMessageMapper.findByUserId(user.getId(), normalizeLimit(limit));
    }

    public List<BoatMessage> listCollectedMessages(String openId, Integer limit) {
        User user = requireUser(openId);
        if (user == null) {
            return Collections.emptyList();
        }
        return boatMessageMapper.findCollectedByUserId(user.getId(), normalizeLimit(limit));
    }

    public List<BoatMessage> listRecentReceivedMessages(String openId, Integer limit) {
        User user = requireUser(openId);
        if (user == null) {
            return Collections.emptyList();
        }
        return boatMessageMapper.findRecentReceivedByUserId(user.getId(), normalizeLimit(limit));
    }

    public BoatThreadResult getThread(String openId, String messageId) {
        User user = requireUser(openId);
        if (user == null) {
            return null;
        }
        if (messageId == null || messageId.trim().isEmpty()) {
            throw new IllegalArgumentException("诗笺ID不能为空");
        }
        BoatMessage current = requireMessage(messageId);
        while (current.getParentMessageId() != null && !current.getParentMessageId().trim().isEmpty()) {
            current = requireMessage(current.getParentMessageId());
        }
        List<BoatMessage> thread = boatMessageMapper.findThread(current.getId());
        if (thread == null || thread.isEmpty()) {
            return null;
        }
        BoatThreadResult result = new BoatThreadResult();
        result.setRoot(thread.get(0));
        if (thread.size() > 1) {
            result.setReplies(thread.subList(1, thread.size()));
        } else {
            result.setReplies(Collections.emptyList());
        }
        return result;
    }

    @Transactional
    public BoatMessage publishMessage(String openId, String content, String signature) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        String cleanContent = normalizeText(content, 160, "诗句");
        String cleanSignature = normalizeText(signature, 40, "署名");
        BoatMessage message = new BoatMessage();
        message.setId(buildId("boat"));
        message.setUserId(user.getId());
        message.setContent(cleanContent);
        message.setSignature(cleanSignature);
        message.setParentMessageId(null);
        message.setReplyCount(0);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(message.getCreatedAt());
        boatMessageMapper.insert(message);
        return boatMessageMapper.findById(message.getId());
    }

    @Transactional
    public BoatMessage receiveRandom(String openId) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        List<BoatMessage> candidates = boatMessageMapper.findAvailableCandidates(user.getId(), 50);
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }

        Random random = new Random();
        int attempts = Math.min(5, candidates.size());
        for (int i = 0; i < attempts; i++) {
            BoatMessage picked = candidates.get(random.nextInt(candidates.size()));
            if (markMatchIfAbsent(user.getId(), picked.getId(), MATCH_RECEIVED)) {
                return picked;
            }
        }
        return null;
    }

    @Transactional
    public BoatMessage collectMessage(String openId, String messageId) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        BoatMessage message = requireMessage(messageId);
        if (!markMatchIfAbsent(user.getId(), message.getId(), MATCH_BOOKMARKED)) {
            return message;
        }
        return boatMessageMapper.findById(message.getId());
    }

    @Transactional
    public BoatThreadResult replyMessage(String openId, String messageId, String replyText, String signature) {
        User user = requireUser(openId);
        if (user == null) {
            throw new IllegalStateException("未找到用户");
        }
        BoatMessage source = requireMessage(messageId);
        String cleanReply = normalizeText(replyText, 160, "回复内容");
        String cleanSignature = normalizeText(signature, 40, "署名");
        if (!markMatchIfAbsent(user.getId(), source.getId(), MATCH_REPLIED)) {
            throw new IllegalArgumentException("这条诗笺已经回复过了");
        }

        BoatMessage reply = new BoatMessage();
        reply.setId(buildId("boat"));
        reply.setUserId(user.getId());
        reply.setContent(cleanReply);
        reply.setSignature(cleanSignature);
        reply.setParentMessageId(source.getId());
        reply.setReplyCount(0);
        reply.setCreatedAt(LocalDateTime.now());
        reply.setUpdatedAt(reply.getCreatedAt());
        boatMessageMapper.insert(reply);
        boatMessageMapper.incrementReplyCount(source.getId());
        return getThread(openId, source.getId());
    }

    private boolean markMatchIfAbsent(String userId, String messageId, String matchType) {
        BoatMatch existing = boatMatchMapper.findByUserIdAndMessageIdAndMatchType(userId, messageId, matchType);
        if (existing != null) {
            return false;
        }
        BoatMatch match = new BoatMatch();
        match.setId(buildId("bm"));
        match.setUserId(userId);
        match.setMessageId(messageId);
        match.setMatchType(matchType);
        match.setCreatedAt(LocalDateTime.now());
        boatMatchMapper.insert(match);
        return true;
    }

    private BoatMessage requireMessage(String messageId) {
        if (messageId == null || messageId.trim().isEmpty()) {
            throw new IllegalArgumentException("诗笺ID不能为空");
        }
        BoatMessage message = boatMessageMapper.findById(messageId.trim());
        if (message == null) {
            throw new IllegalArgumentException("诗笺不存在");
        }
        return message;
    }

    private User requireUser(String openId) {
        if (openId == null || openId.trim().isEmpty()) {
            return null;
        }
        return userMapper.findByOpenId(openId);
    }

    private String buildId(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, 100);
    }

    private String normalizeText(String text, int maxLength, String label) {
        if (text == null) {
            throw new IllegalArgumentException(label + "不能为空");
        }
        String clean = text.trim();
        if (clean.isEmpty()) {
            throw new IllegalArgumentException(label + "不能为空");
        }
        if (clean.length() > maxLength) {
            clean = clean.substring(0, maxLength);
        }
        return clean;
    }
}
