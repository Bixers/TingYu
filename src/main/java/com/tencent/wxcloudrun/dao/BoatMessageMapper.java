package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.BoatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BoatMessageMapper {

    int insert(BoatMessage message);

    BoatMessage findById(@Param("id") String id);

    List<BoatMessage> findLatest(@Param("userId") String userId,
                                 @Param("limit") Integer limit);

    List<BoatMessage> findByUserId(@Param("userId") String userId,
                                   @Param("limit") Integer limit);

    List<BoatMessage> findCollectedByUserId(@Param("userId") String userId,
                                            @Param("limit") Integer limit);

    List<BoatMessage> findRecentReceivedByUserId(@Param("userId") String userId,
                                                 @Param("limit") Integer limit);

    List<BoatMessage> findThread(@Param("rootId") String rootId);

    List<BoatMessage> findAvailableCandidates(@Param("userId") String userId,
                                              @Param("limit") Integer limit);

    int incrementReplyCount(@Param("id") String id);
}
