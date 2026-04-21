package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.PinyinResult;
import com.tencent.wxcloudrun.dto.RhymeResult;
import com.tencent.wxcloudrun.dto.TtsResult;
import com.tencent.wxcloudrun.service.PinyinService;
import com.tencent.wxcloudrun.service.RhymeService;
import com.tencent.wxcloudrun.service.SpeechSynthesisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "*")
public class ToolController {

    @Autowired
    private PinyinService pinyinService;

    @Autowired
    private SpeechSynthesisService speechSynthesisService;

    @Autowired
    private RhymeService rhymeService;

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

    @PostMapping("/tts")
    public ApiResponse<TtsResult> textToSpeech(@RequestBody Map<String, String> body) {
        try {
            String text = body.get("text");
            String voice = body.get("voice");
            String outputFormat = body.get("outputFormat");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error("text 参数不能为空");
            }
            TtsResult result = speechSynthesisService.synthesize(text, voice, outputFormat);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("语音合成失败: " + e.getMessage());
        }
    }

    @PostMapping("/rhyme")
    public ApiResponse<RhymeResult> rhyme(@RequestBody Map<String, String> body) {
        try {
            String text = body.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error("text 参数不能为空");
            }
            RhymeResult result = rhymeService.lookup(text);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("韵部查询失败: " + e.getMessage());
        }
    }
}
