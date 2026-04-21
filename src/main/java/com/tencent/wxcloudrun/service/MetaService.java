package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.PoemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class MetaService {

    @Autowired
    private PoemMapper poemMapper;

    @Value("${wechat.subscribe.template-id:}")
    private String dailyRainTemplateId;

    public List<Map<String, Object>> getDynastyList() {
        return poemMapper.findDynastyStats();
    }

    public List<Map<String, Object>> getAuthorList(String dynasty) {
        return poemMapper.findAuthorStats(dynasty);
    }

    public Map<String, Object> getAppConfig() {
        return Collections.<String, Object>singletonMap(
                "dailyRainTemplateId",
                dailyRainTemplateId == null ? "" : dailyRainTemplateId.trim());
    }
}
