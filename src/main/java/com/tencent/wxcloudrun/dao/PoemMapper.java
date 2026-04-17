package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Poem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

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

    /**
     * 清空所有诗词
     */
    @Delete("DELETE FROM poems")
    int deleteAll();

    /**
     * 朝代统计
     */
    List<Map<String, Object>> findDynastyStats();

    /**
     * 作者统计
     */
    List<Map<String, Object>> findAuthorStats(@Param("dynasty") String dynasty);

    /**
     * 按title+author查重
     */
    @Select("SELECT COUNT(*) FROM poems WHERE title = #{title} AND author = #{author}")
    int countByTitleAndAuthor(@Param("title") String title, @Param("author") String author);

    /**
     * 按title+author查找诗词
     */
    @Select("SELECT * FROM poems WHERE title = #{title} AND author = #{author} LIMIT 1")
    Poem findByTitleAndAuthor(@Param("title") String title, @Param("author") String author);

    /**
     * 仅更新富化字段（译文/赏析/注释/标签）
     */
    int updateEnrichment(Poem poem);
}
