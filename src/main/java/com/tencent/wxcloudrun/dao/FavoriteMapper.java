package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Favorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteMapper {

    int insert(Favorite favorite);

    int deleteById(@Param("id") String id);

    int deleteByUserIdAndTypeAndTargetKey(@Param("userId") String userId,
                                          @Param("favoriteType") String favoriteType,
                                          @Param("targetKey") String targetKey);

    Favorite findById(@Param("id") String id);

    Favorite findByUserIdAndTypeAndTargetKey(@Param("userId") String userId,
                                             @Param("favoriteType") String favoriteType,
                                             @Param("targetKey") String targetKey);

    List<Favorite> findByUserId(@Param("userId") String userId,
                                @Param("favoriteType") String favoriteType);
}
