package com.tencent.wxcloudrun.dto;

import com.tencent.wxcloudrun.model.Favorite;
import lombok.Data;

/**
 * 收藏操作结果
 */
@Data
public class FavoriteActionResult {

    private boolean collected;
    private Favorite favorite;
}
