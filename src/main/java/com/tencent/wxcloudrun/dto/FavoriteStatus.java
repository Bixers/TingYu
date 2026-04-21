package com.tencent.wxcloudrun.dto;

import lombok.Data;

/**
 * 收藏状态
 */
@Data
public class FavoriteStatus {

    private boolean fullCollected;
    private String fullFavoriteId;
    private boolean sentenceCollected;
    private String sentenceFavoriteId;
}
