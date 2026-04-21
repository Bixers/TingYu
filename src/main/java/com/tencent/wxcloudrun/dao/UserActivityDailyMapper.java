package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.UserActivityDaily;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface UserActivityDailyMapper {

    int insert(UserActivityDaily activity);

    int update(UserActivityDaily activity);

    UserActivityDaily findByUserIdAndDate(@Param("userId") String userId,
                                          @Param("activityDate") LocalDate activityDate);

    List<UserActivityDaily> findRecentByUserId(@Param("userId") String userId,
                                               @Param("limit") Integer limit);
}

