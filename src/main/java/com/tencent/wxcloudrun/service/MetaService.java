package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.PoemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MetaService {

    @Autowired
    private PoemMapper poemMapper;

    public List<Map<String, Object>> getDynastyList() {
        return poemMapper.findDynastyStats();
    }

    public List<Map<String, Object>> getAuthorList(String dynasty) {
        return poemMapper.findAuthorStats(dynasty);
    }
}
