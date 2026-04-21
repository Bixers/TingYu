package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.UserActivityDailyMapper;
import com.tencent.wxcloudrun.dao.UserMapper;
import com.tencent.wxcloudrun.dto.UsageSummary;
import com.tencent.wxcloudrun.model.User;
import com.tencent.wxcloudrun.model.UserActivityDaily;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class UserActivityService {

    @Autowired
    private UserActivityDailyMapper userActivityDailyMapper;

    @Autowired
    private UserMapper userMapper;

    public void recordPoemView(String openId) {
        increment(openId, 1, 0, 0, 0);
    }

    public void recordSearch(String openId) {
        increment(openId, 0, 1, 0, 0);
    }

    public void recordExcerpt(String openId) {
        increment(openId, 0, 0, 1, 0);
    }

    public void recordFavorite(String openId) {
        increment(openId, 0, 0, 0, 1);
    }

    public UsageSummary buildSummary(String openId) {
        User user = requireUser(openId);
        if (user == null) {
            return emptySummary();
        }

        List<UserActivityDaily> recent = userActivityDailyMapper.findRecentByUserId(user.getId(), 90);
        if (recent == null) {
            recent = Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        LocalDate start = user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : today;
        int daysElapsed = (int) ChronoUnit.DAYS.between(start, today) + 1;
        if (daysElapsed < 1) daysElapsed = 1;

        int totalPoems = 0;
        int totalViews = 0;
        int totalSearches = 0;
        int totalExcerpts = 0;
        int totalFavorites = 0;

        for (UserActivityDaily item : recent) {
            if (item == null) continue;
            totalPoems += safe(item.getPoemViews()) > 0 ? 1 : 0;
            totalViews += safe(item.getPoemViews());
            totalSearches += safe(item.getSearchCount());
            totalExcerpts += safe(item.getExcerptCount());
            totalFavorites += safe(item.getFavoriteCount());
        }

        List<UsageSummary.UsageSeriesPoint> series = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            UserActivityDaily daily = find(recent, day);
            UsageSummary.UsageSeriesPoint point = new UsageSummary.UsageSeriesPoint();
            point.setDayKey(day.toString());
            point.setPoems(daily == null ? 0 : (safe(daily.getPoemViews()) > 0 ? 1 : 0));
            point.setViews(daily == null ? 0 : safe(daily.getPoemViews()));
            point.setSearches(daily == null ? 0 : safe(daily.getSearchCount()));
            point.setExcerpts(daily == null ? 0 : safe(daily.getExcerptCount()));
            point.setFavorites(daily == null ? 0 : safe(daily.getFavoriteCount()));
            series.add(point);
        }

        UsageSummary summary = new UsageSummary();
        summary.setDaysElapsed(daysElapsed);
        summary.setTotalPoems(totalPoems);
        summary.setTotalViews(totalViews);
        summary.setTotalSearches(totalSearches);
        summary.setTotalExcerpts(totalExcerpts);
        summary.setTotalFavorites(totalFavorites);
        summary.setSeries(series);
        return summary;
    }

    private void increment(String openId, int poemViews, int searchCount, int excerptCount, int favoriteCount) {
        User user = requireUser(openId);
        if (user == null) {
            return;
        }

        LocalDate today = LocalDate.now();
        UserActivityDaily existing = userActivityDailyMapper.findByUserIdAndDate(user.getId(), today);
        if (existing == null) {
            existing = new UserActivityDaily();
            existing.setId("ua_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8));
            existing.setUserId(user.getId());
            existing.setActivityDate(today);
            existing.setPoemViews(poemViews);
            existing.setSearchCount(searchCount);
            existing.setExcerptCount(excerptCount);
            existing.setFavoriteCount(favoriteCount);
            existing.setCreatedAt(LocalDateTime.now());
            existing.setUpdatedAt(existing.getCreatedAt());
            userActivityDailyMapper.insert(existing);
            return;
        }

        existing.setPoemViews(safe(existing.getPoemViews()) + poemViews);
        existing.setSearchCount(safe(existing.getSearchCount()) + searchCount);
        existing.setExcerptCount(safe(existing.getExcerptCount()) + excerptCount);
        existing.setFavoriteCount(safe(existing.getFavoriteCount()) + favoriteCount);
        existing.setUpdatedAt(LocalDateTime.now());
        userActivityDailyMapper.update(existing);
    }

    private User requireUser(String openId) {
        if (openId == null || openId.trim().isEmpty()) {
            return null;
        }
        return userMapper.findByOpenId(openId);
    }

    private UserActivityDaily find(List<UserActivityDaily> list, LocalDate day) {
        if (list == null) return null;
        for (UserActivityDaily item : list) {
            if (item != null && day.equals(item.getActivityDate())) {
                return item;
            }
        }
        return null;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private UsageSummary emptySummary() {
        LocalDate today = LocalDate.now();
        List<UsageSummary.UsageSeriesPoint> series = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            UsageSummary.UsageSeriesPoint point = new UsageSummary.UsageSeriesPoint();
            point.setDayKey(day.toString());
            point.setPoems(0);
            point.setViews(0);
            point.setSearches(0);
            point.setExcerpts(0);
            point.setFavorites(0);
            series.add(point);
        }
        UsageSummary summary = new UsageSummary();
        summary.setDaysElapsed(1);
        summary.setTotalPoems(0);
        summary.setTotalViews(0);
        summary.setTotalSearches(0);
        summary.setTotalExcerpts(0);
        summary.setTotalFavorites(0);
        summary.setSeries(series);
        return summary;
    }
}
