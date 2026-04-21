package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE open_id = #{openId} LIMIT 1")
    User findByOpenId(@Param("openId") String openId);

    @Select("SELECT * FROM users WHERE rain_push_enabled = 1")
    List<User> findRainPushEnabledUsers();

    int insert(User user);

    int update(User user);
}
