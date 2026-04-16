package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.PinyinResult;
import com.tencent.wxcloudrun.service.PinyinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "*")
public class ToolController {

    @Autowired
    private PinyinService pinyinService;

    @PostMapping("/pinyin")
    public ApiResponse<PinyinResult> getPinyin(@RequestBody Map<String, String> body) {
        try {
            String text = body.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error("text 参数不能为空");
            }
            // 限制长度
            if (text.length() > 500) {
                text = text.substring(0, 500);
            }
            PinyinResult result = pinyinService.convertToPinyin(text);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("拼音转换失败：" + e.getMessage());
        }
    }
}
