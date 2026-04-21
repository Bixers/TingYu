package com.tencent.wxcloudrun.dto;

import lombok.Data;

import java.util.List;

@Data
public class UsageSummary {

    private Integer daysElapsed;
    private Integer totalPoems;
    private Integer totalViews;
    private Integer totalSearches;
    private Integer totalExcerpts;
    private Integer totalFavorites;
    private List<UsageSeriesPoint> series;

    @Data
    public static class UsageSeriesPoint {
        private String dayKey;
        private Integer poems;
        private Integer views;
        private Integer searches;
        private Integer excerpts;
        private Integer favorites;
    }
}

