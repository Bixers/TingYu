package com.tencent.wxcloudrun.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tencent.wxcloudrun.dto.TtsResult;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SpeechSynthesisService {

    private static final String SERVICE = "tts";
    private static final String HOST = "tts.tencentcloudapi.com";
    private static final String VERSION = "2019-08-23";
    private static final String ACTION_TEXT_TO_VOICE = "TextToVoice";
    private static final String ACTION_CREATE_TASK = "CreateTtsTask";
    private static final String ACTION_DESCRIBE_TASK = "DescribeTtsTaskStatus";
    private static final String DEFAULT_VOICE = "101001";
    private static final String DEFAULT_FORMAT = "mp3";
    private static final String DEFAULT_REGION = "ap-guangzhou";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TtsResult synthesize(String text, String voice, String outputFormat) {
        String cleanText = normalizeText(text);
        if (cleanText.isEmpty()) {
            throw new IllegalArgumentException("文本不能为空");
        }

        String appId = requireEnv("TENCENT_TTS_APP_ID");
        String secretId = requireEnv("TENCENT_TTS_SECRET_ID");
        String secretKey = requireEnv("TENCENT_TTS_SECRET_KEY");
        String actualVoice = normalizeVoice(voice);
        String actualFormat = normalizeFormat(outputFormat);
        double speed = normalizeSpeed(System.getenv("TENCENT_TTS_SPEED"));
        double volume = normalizeVolume(System.getenv("TENCENT_TTS_VOLUME"));
        String region = normalizeRegion(System.getenv("TENCENT_TTS_REGION"));

        if (cleanText.length() <= 150) {
            return synthesizeShortText(appId, secretId, secretKey, actualVoice, actualFormat, speed, volume, region, cleanText);
        }
        return synthesizeLongText(appId, secretId, secretKey, actualVoice, actualFormat, speed, volume, region, cleanText);
    }

    private TtsResult synthesizeShortText(String appId, String secretId, String secretKey, String voice, String format,
                                          double speed, double volume, String region, String text) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("AppId", Integer.parseInt(appId));
        payload.put("Text", text);
        payload.put("SessionId", UUID.randomUUID().toString());
        payload.put("VoiceType", parseIntOrDefault(voice, Integer.parseInt(DEFAULT_VOICE)));
        payload.put("Codec", format);
        payload.put("ProjectId", 0);
        payload.put("ModelType", 1);
        payload.put("PrimaryLanguage", 1);
        payload.put("SampleRate", 16000);
        payload.put("Speed", speed);
        payload.put("Volume", volume);

        Map<String, Object> response = invokeAction(secretId, secretKey, region, ACTION_TEXT_TO_VOICE, payload);
        Map<String, Object> responseNode = getResponseNode(response);
        String audioBase64 = asString(responseNode.get("Audio"));
        if (audioBase64 == null || audioBase64.trim().isEmpty()) {
            throw new IllegalStateException("语音合成失败");
        }
        return buildResult(audioBase64.trim(), voice, format);
    }

    private TtsResult synthesizeLongText(String appId, String secretId, String secretKey, String voice, String format,
                                         double speed, double volume, String region, String text) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("AppId", Integer.parseInt(appId));
        payload.put("Text", text);
        payload.put("VoiceType", parseIntOrDefault(voice, Integer.parseInt(DEFAULT_VOICE)));
        payload.put("Codec", format);
        payload.put("ProjectId", 0);
        payload.put("ModelType", 1);
        payload.put("PrimaryLanguage", 1);
        payload.put("SampleRate", 16000);
        payload.put("Speed", speed);
        payload.put("Volume", volume);
        Map<String, Object> createResponse = invokeAction(secretId, secretKey, region, ACTION_CREATE_TASK, payload);
        Map<String, Object> createNode = getResponseNode(createResponse);
        Map<String, Object> dataNode = asMap(createNode.get("Data"));
        String taskId = dataNode == null ? null : asString(dataNode.get("TaskId"));
        if (taskId == null || taskId.trim().isEmpty()) {
            throw new IllegalStateException("创建语音任务失败");
        }

        String resultUrl = waitForTaskResultUrl(secretId, secretKey, region, taskId.trim());
        if (resultUrl == null || resultUrl.trim().isEmpty()) {
            throw new IllegalStateException("语音任务未返回结果");
        }

        byte[] audioBytes;
        try {
            ResponseEntity<byte[]> response = restTemplate.getForEntity(resultUrl.trim(), byte[].class);
            audioBytes = response.getBody();
        } catch (RestClientException e) {
            throw new IllegalStateException("下载语音结果失败: " + e.getMessage(), e);
        }

        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalStateException("语音结果为空");
        }

        return buildResult(Base64.getEncoder().encodeToString(audioBytes), voice, format);
    }

    private String waitForTaskResultUrl(String secretId, String secretKey, String region, String taskId) {
        int attempts = 12;
        for (int i = 0; i < attempts; i++) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("TaskId", taskId);
            Map<String, Object> response = invokeAction(secretId, secretKey, region, ACTION_DESCRIBE_TASK, payload);
            Map<String, Object> responseNode = getResponseNode(response);
            Map<String, Object> dataNode = asMap(responseNode.get("Data"));
            if (dataNode != null) {
                Integer status = asInteger(dataNode.get("Status"));
                if (status != null) {
                    if (status == 2) {
                        return asString(dataNode.get("ResultUrl"));
                    }
                    if (status == 3) {
                        String message = asString(dataNode.get("ResultDetail"));
                        if (message == null || message.trim().isEmpty()) {
                            message = "语音任务失败";
                        }
                        throw new IllegalStateException(message);
                    }
                }
            }
            try {
                TimeUnit.MILLISECONDS.sleep(1000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("语音任务等待被中断", e);
            }
        }
        throw new IllegalStateException("语音合成超时");
    }

    private Map<String, Object> invokeAction(String secretId, String secretKey, String region, String action, Map<String, Object> payload) {
        try {
            String body = objectMapper.writeValueAsString(payload);
            String timestamp = String.valueOf(Instant.now().getEpochSecond());
            String date = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_LOCAL_DATE);
            String canonicalHeaders = "content-type:application/json; charset=utf-8\n"
                    + "host:" + HOST + "\n"
                    + "x-tc-action:" + action.toLowerCase() + "\n";
            String signedHeaders = "content-type;host;x-tc-action";
            String hashedRequestPayload = sha256Hex(body);
            String canonicalRequest = "POST\n/\n\n"
                    + canonicalHeaders + "\n"
                    + signedHeaders + "\n"
                    + hashedRequestPayload;
            String stringToSign = "TC3-HMAC-SHA256\n"
                    + timestamp + "\n"
                    + date + "/" + SERVICE + "/tc3_request\n"
                    + sha256Hex(canonicalRequest);
            byte[] secretDate = hmacSha256(("TC3" + secretKey).getBytes(StandardCharsets.UTF_8), date);
            byte[] secretService = hmacSha256(secretDate, SERVICE);
            byte[] secretSigning = hmacSha256(secretService, "tc3_request");
            String signature = bytesToHex(hmacSha256(secretSigning, stringToSign));
            String authorization = "TC3-HMAC-SHA256 "
                    + "Credential=" + secretId + "/" + date + "/" + SERVICE + "/tc3_request, "
                    + "SignedHeaders=" + signedHeaders + ", "
                    + "Signature=" + signature;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/json; charset=utf-8"));
            headers.set("Host", HOST);
            headers.set("X-TC-Action", action);
            headers.set("X-TC-Version", VERSION);
            headers.set("Authorization", authorization);
            headers.set("X-TC-Timestamp", timestamp);
            if (region != null && !region.trim().isEmpty()) {
                headers.set("X-TC-Region", region.trim());
            }

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://" + HOST,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.trim().isEmpty()) {
                throw new IllegalStateException("语音服务无返回");
            }

            Map<String, Object> responseMap = objectMapper.readValue(
                    responseBody,
                    new TypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> responseNode = getResponseNode(responseMap);
            Map<String, Object> errorNode = asMap(responseNode.get("Error"));
            if (errorNode != null && !errorNode.isEmpty()) {
                String code = asString(errorNode.get("Code"));
                String message = asString(errorNode.get("Message"));
                if (code != null && message != null) {
                    throw new IllegalStateException(code + ": " + message);
                }
                throw new IllegalStateException("腾讯云语音服务调用失败");
            }
            return responseMap;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("腾讯云语音服务调用失败: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> getResponseNode(Map<String, Object> response) {
        Map<String, Object> responseNode = asMap(response.get("Response"));
        if (responseNode == null) {
            throw new IllegalStateException("腾讯云语音服务返回异常");
        }
        return responseNode;
    }

    private TtsResult buildResult(String audioBase64, String voice, String format) {
        TtsResult result = new TtsResult();
        result.setProvider("tencent");
        result.setVoice(normalizeVoice(voice));
        result.setContentType(resolveContentType(format));
        result.setFileExtension(resolveFileExtension(format));
        result.setAudioBase64(audioBase64);
        return result;
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.replace('\r', ' ').replace('\n', ' ').trim();
    }

    private String normalizeVoice(String voice) {
        if (voice == null || voice.trim().isEmpty()) {
            return DEFAULT_VOICE;
        }
        return voice.trim();
    }

    private String normalizeFormat(String format) {
        if (format == null || format.trim().isEmpty()) {
            return DEFAULT_FORMAT;
        }
        String trimmed = format.trim().toLowerCase();
        if (trimmed.contains("wav")) {
            return "wav";
        }
        return "mp3";
    }

    private String normalizeRegion(String region) {
        if (region == null || region.trim().isEmpty()) {
            return DEFAULT_REGION;
        }
        return region.trim();
    }

    private double normalizeSpeed(String speedValue) {
        double speed = parseDoubleOrDefault(speedValue, 0d);
        if (speed < -2d) {
            return -2d;
        }
        if (speed > 6d) {
            return 6d;
        }
        return speed;
    }

    private double normalizeVolume(String volumeValue) {
        double volume = parseDoubleOrDefault(volumeValue, 0d);
        if (volume >= -10d && volume <= 10d) {
            return volume;
        }
        double mapped = volume / 5d - 10d;
        if (mapped < -10d) {
            return -10d;
        }
        if (mapped > 10d) {
            return 10d;
        }
        return mapped;
    }

    private String resolveContentType(String format) {
        if (format != null && format.toLowerCase().contains("wav")) {
            return "audio/wav";
        }
        return "audio/mpeg";
    }

    private String resolveFileExtension(String format) {
        if (format != null && format.toLowerCase().contains("wav")) {
            return "wav";
        }
        return "mp3";
    }

    private String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException("未配置腾讯云语音服务，请设置 " + name);
        }
        return value.trim();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map) {
            return (Map<String, Object>) value;
        }
        return null;
    }

    private int parseIntOrDefault(String value, int defaultValue) {
        try {
            return Integer.parseInt(normalizeVoice(value));
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private double parseDoubleOrDefault(String value, double defaultValue) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return defaultValue;
            }
            return Double.parseDouble(value.trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private String sha256Hex(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private byte[] hmacSha256(byte[] key, String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
