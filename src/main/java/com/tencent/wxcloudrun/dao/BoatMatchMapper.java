package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.BoatMatch;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface BoatMatchMapper {

    int insert(BoatMatch match);

    BoatMatch findByUserIdAndMessageIdAndMatchType(@Param("userId") String userId,
                                                   @Param("messageId") String messageId,
                                                   @Param("matchType") String matchType);
}

