package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.Excerpt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ExcerptMapper {

    int insert(Excerpt excerpt);

    int updateNote(@Param("id") String id, @Param("note") String note);

    int deleteById(@Param("id") String id);

    Excerpt findById(@Param("id") String id);

    Excerpt findByUserIdAndPoemIdAndSentenceIndexAndSentenceText(@Param("userId") String userId,
                                                                 @Param("poemId") String poemId,
                                                                 @Param("sentenceIndex") Integer sentenceIndex,
                                                                 @Param("sentenceText") String sentenceText);

    List<Excerpt> findByUserId(@Param("userId") String userId);
}
