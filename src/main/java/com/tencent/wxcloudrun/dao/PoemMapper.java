package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Poem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PoemMapper {

    /**
     * 根据ID查询诗词
     */
    @Select("SELECT * FROM poems WHERE id = #{id}")
    Poem findById(String id);

    /**
     * 查询所有诗词
     */
    @Select("SELECT * FROM poems")
    List<Poem> findAll();

    /**
     * 根据朝代查询
     */
    @Select("SELECT * FROM poems WHERE dynasty = #{dynasty}")
    List<Poem> findByDynasty(String dynasty);

    /**
     * 随机获取一首诗词
     */
    @Select("SELECT * FROM poems ORDER BY RAND() LIMIT 1")
    Poem findRandomPoem();

    /**
     * 搜索诗词
     */
    List<Poem> searchPoems(@Param("keyword") String keyword, 
                           @Param("dynasty") String dynasty,
                           @Param("offset") int offset, 
                           @Param("limit") int limit);

    /**
     * 统计搜索总数
     */
    Long countSearchPoems(@Param("keyword") String keyword, 
                          @Param("dynasty") String dynasty);

    /**
     * 插入诗词
     */
    int insert(Poem poem);

    /**
     * 更新诗词
     */
    int update(Poem poem);

    /**
     * 删除诗词
     */
    int deleteById(String id);
}
