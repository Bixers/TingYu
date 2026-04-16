package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Tag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TagMapper {

    @Select("SELECT * FROM tags ORDER BY category, name")
    List<Tag> findAll();

    @Select("SELECT * FROM tags WHERE category = #{category} ORDER BY name")
    List<Tag> findByCategory(String category);
}
