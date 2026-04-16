package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Author;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AuthorMapper {

    @Select("SELECT * FROM authors WHERE name = #{name} LIMIT 1")
    Author findByName(@Param("name") String name);

    @Select("SELECT * FROM authors WHERE id = #{id}")
    Author findById(String id);

    @Select("SELECT COUNT(*) FROM authors WHERE name = #{name}")
    int countByName(@Param("name") String name);

    List<Author> findByDynasty(@Param("dynasty") String dynasty);

    int insert(Author author);
}
