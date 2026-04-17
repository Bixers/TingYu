package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.DailyPoem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DailyPoemMapper {

    DailyPoem findByDate(String date);

    int insert(DailyPoem dailyPoem);

    @Select("SELECT COUNT(*) FROM daily_poems WHERE date = #{date}")
    boolean existsByDate(String date);

    @Delete("DELETE FROM daily_poems WHERE poem_id = #{poemId}")
    int deleteByPoemId(String poemId);
}
