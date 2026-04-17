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

    @Select("SELECT * FROM poems WHERE id = #{id}")
    Poem findById(String id);

    @Select("SELECT * FROM poems")
    List<Poem> findAll();

    @Select("SELECT * FROM poems WHERE dynasty = #{dynasty}")
    List<Poem> findByDynasty(String dynasty);

    @Select("SELECT * FROM poems ORDER BY RAND() LIMIT 1")
    Poem findRandomPoem();

    @Select("SELECT COUNT(*) FROM poems")
    int countAll();

    Poem findRandomPoemExcluding(@Param("excludeIds") List<String> excludeIds,
                                 @Param("offset") int offset);

    List<Poem> findScanPage(@Param("offset") int offset, @Param("limit") int limit);

    List<Poem> searchPoems(@Param("keyword") String keyword,
                           @Param("dynasty") String dynasty,
                           @Param("offset") int offset,
                           @Param("limit") int limit);

    Long countSearchPoems(@Param("keyword") String keyword,
                          @Param("dynasty") String dynasty);

    int insert(Poem poem);

    int update(Poem poem);

    int deleteById(String id);

    @Delete("DELETE FROM poems")
    int deleteAll();

    List<Map<String, Object>> findDynastyStats();

    List<Map<String, Object>> findAuthorStats(@Param("dynasty") String dynasty);

    @Select("SELECT COUNT(*) FROM poems WHERE title = #{title} AND author = #{author}")
    int countByTitleAndAuthor(@Param("title") String title, @Param("author") String author);

    @Select("SELECT * FROM poems WHERE title = #{title} AND author = #{author} LIMIT 1")
    Poem findByTitleAndAuthor(@Param("title") String title, @Param("author") String author);

    int updateEnrichment(Poem poem);
}
