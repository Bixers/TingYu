package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dto.TtsResult;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SpeechSynthesisService {

    private static final String PROVIDER = "azure";
    private static final String DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural";
    private static final String DEFAULT_FORMAT = "audio-24khz-96kbitrate-mono-mp3";

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public TtsResult synthesize(String text, String voice, String outputFormat) {
        String cleanText = normalizeText(text);
        if (cleanText.isEmpty()) {
            throw new IllegalArgumentException("文本不能为空");
        }
        if (cleanText.length() > 1000) {
            cleanText = cleanText.substring(0, 1000);
        }

        String actualVoice = normalizeOrDefault(voice, DEFAULT_VOICE);
        String actualFormat = normalizeOrDefault(outputFormat, DEFAULT_FORMAT);
        String cacheKey = buildCacheKey(cleanText, actualVoice, actualFormat);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.toResult(actualVoice, actualFormat);
        }

        String speechKey = System.getenv("AZURE_SPEECH_KEY");
        String speechRegion = System.getenv("AZURE_SPEECH_REGION");
        if (speechKey == null || speechKey.trim().isEmpty() || speechRegion == null || speechRegion.trim().isEmpty()) {
            throw new IllegalStateException("未配置 Azure 语音服务，请设置 AZURE_SPEECH_KEY 和 AZURE_SPEECH_REGION");
        }

        String endpoint = String.format("https://%s.tts.speech.microsoft.com/cognitiveservices/v1", speechRegion.trim());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("application/ssml+xml"));
        headers.set("Ocp-Apim-Subscription-Key", speechKey.trim());
        headers.set("X-Microsoft-OutputFormat", actualFormat);
        headers.set("User-Agent", "TingYu-Reader");

        String ssml = buildSsml(cleanText, actualVoice, getSpeechRate(), getSpeechStyle());
        HttpEntity<String> request = new HttpEntity<>(ssml, headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                request,
                byte[].class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().length == 0) {
            throw new IllegalStateException("语音合成失败");
        }

        TtsResult result = new TtsResult();
        result.setProvider(PROVIDER);
        result.setVoice(actualVoice);
        result.setContentType(resolveContentType(actualFormat));
        result.setFileExtension(resolveFileExtension(actualFormat));
        result.setAudioBase64(Base64.getEncoder().encodeToString(response.getBody()));

        cache.put(cacheKey, CacheEntry.from(result));
        return result;
    }

    private String getSpeechRate() {
        String rate = System.getenv("AZURE_SPEECH_RATE");
        if (rate == null || rate.trim().isEmpty()) {
            return "0%";
        }
        return rate.trim();
    }

    private String getSpeechStyle() {
        String style = System.getenv("AZURE_SPEECH_STYLE");
        if (style == null || style.trim().isEmpty()) {
            return "poetry-reading";
        }
        return style.trim();
    }

    private String buildSsml(String text, String voice, String rate, String style) {
        String escapedText = escapeXml(text);
        String escapedVoice = escapeXml(voice);
        String escapedRate = escapeXml(rate);
        String escapedStyle = escapeXml(style);
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" "
                + "xmlns:mstts=\"http://www.w3.org/2001/mstts\" xml:lang=\"zh-CN\">"
                + "<voice name=\"" + escapedVoice + "\">"
                + "<mstts:express-as style=\"" + escapedStyle + "\">"
                + "<prosody rate=\"" + escapedRate + "\">"
                + escapedText
                + "</prosody>"
                + "</mstts:express-as>"
                + "</voice>"
                + "</speak>";
    }

    private String resolveContentType(String format) {
        if (format != null && format.toLowerCase().contains("mp3")) {
            return "audio/mpeg";
        }
        return "audio/wav";
    }

    private String resolveFileExtension(String format) {
        if (format != null && format.toLowerCase().contains("mp3")) {
            return "mp3";
        }
        return "wav";
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.replace('\r', ' ').replace('\n', ' ').trim();
    }

    private String normalizeOrDefault(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim();
    }

    private String buildCacheKey(String text, String voice, String format) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((text + "|" + voice + "|" + format).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return text + "|" + voice + "|" + format;
        }
    }

    private String escapeXml(String text) {
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private static class CacheEntry {
        private static final long TTL_MS = 24L * 60L * 60L * 1000L;
        private final String provider;
        private final String voice;
        private final String contentType;
        private final String fileExtension;
        private final String audioBase64;
        private final long createdAt;

        private CacheEntry(String provider, String voice, String contentType, String fileExtension, String audioBase64, long createdAt) {
            this.provider = provider;
            this.voice = voice;
            this.contentType = contentType;
            this.fileExtension = fileExtension;
            this.audioBase64 = audioBase64;
            this.createdAt = createdAt;
        }

        static CacheEntry from(TtsResult result) {
            return new CacheEntry(
                    result.getProvider(),
                    result.getVoice(),
                    result.getContentType(),
                    result.getFileExtension(),
                    result.getAudioBase64(),
                    System.currentTimeMillis()
            );
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > TTL_MS;
        }

        TtsResult toResult(String voice, String format) {
            TtsResult result = new TtsResult();
            result.setProvider(provider);
            result.setVoice(voice);
            result.setContentType(contentType);
            result.setFileExtension(fileExtension);
            result.setAudioBase64(audioBase64);
            return result;
        }
    }
}
