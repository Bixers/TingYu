package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.DailyPoem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DailyPoemMapper {

    /**
     * 根据日期查询（含关联诗词信息，由 XML 定义）
     */
    DailyPoem findByDate(String date);

    /**
     * 插入每日推荐
     */
    int insert(DailyPoem dailyPoem);

    /**
     * 检查日期是否已存在
     */
    @Select("SELECT COUNT(*) FROM daily_poems WHERE date = #{date}")
    boolean existsByDate(String date);
}
