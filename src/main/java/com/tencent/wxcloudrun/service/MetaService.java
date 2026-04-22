package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.PoemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MetaService {

    @Autowired
    private PoemMapper poemMapper;

    @Value("${wechat.subscribe.template-id:}")
    private String dailyRainTemplateId;

    @Value("${rain.audio.sparse-url:}")
    private String rainSparseUrl;

    @Value("${rain.audio.heavy-url:}")
    private String rainHeavyUrl;

    @Value("${rain.audio.night-url:}")
    private String rainNightUrl;

    public List<Map<String, Object>> getDynastyList() {
        return poemMapper.findDynastyStats();
    }

    public List<Map<String, Object>> getAuthorList(String dynasty) {
        return poemMapper.findAuthorStats(dynasty);
    }

    public Map<String, Object> getAppConfig() {
        java.util.Map<String, Object> config = new java.util.HashMap<>();
        config.put("dailyRainTemplateId", dailyRainTemplateId == null ? "" : dailyRainTemplateId.trim());
        config.put("rainSparseUrl", rainSparseUrl == null ? "" : rainSparseUrl.trim());
        config.put("rainHeavyUrl", rainHeavyUrl == null ? "" : rainHeavyUrl.trim());
        config.put("rainNightUrl", rainNightUrl == null ? "" : rainNightUrl.trim());
        return config;
    }

    private boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }
}
