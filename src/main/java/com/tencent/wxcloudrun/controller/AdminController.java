package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.service.PoemCrawlerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private PoemCrawlerService poemCrawlerService;

    /**
     * 触发诗词导入
     * @param source 来源：tang(唐诗), song(宋诗), songci(宋词), all(全部)
     * @param limit 每个来源的导入数量限制
     */
    @PostMapping("/import-poems")
    public ApiResponse<Map<String, Object>> importPoems(
            @RequestParam(defaultValue = "all") String source,
            @RequestParam(defaultValue = "100") int limit) {
        try {
            Map<String, Object> result = new LinkedHashMap<>();
            int totalImported = 0;

            if ("tang".equals(source) || "all".equals(source)) {
                int count = poemCrawlerService.importTangPoems(limit);
                result.put("tang", count);
                totalImported += count;
            }

            if ("song".equals(source) || "all".equals(source)) {
                int count = poemCrawlerService.importSongPoems(limit);
                result.put("song", count);
                totalImported += count;
            }

            if ("songci".equals(source) || "all".equals(source)) {
                int count = poemCrawlerService.importSongCi(limit);
                result.put("songci", count);
                totalImported += count;
            }

            result.put("total", totalImported);
            return ApiResponse.success("导入完成", result);
        } catch (Exception e) {
            return ApiResponse.error("导入失败：" + e.getMessage());
        }
    }
}
