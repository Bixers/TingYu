package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dto.TtsResult;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.tts.v20190823.TtsClient;
import com.tencentcloudapi.tts.v20190823.models.CreateTtsTaskRequest;
import com.tencentcloudapi.tts.v20190823.models.CreateTtsTaskResponse;
import com.tencentcloudapi.tts.v20190823.models.DescribeTtsTaskStatusRequest;
import com.tencentcloudapi.tts.v20190823.models.DescribeTtsTaskStatusResponse;
import com.tencentcloudapi.tts.v20190823.models.TextToVoiceRequest;
import com.tencentcloudapi.tts.v20190823.models.TextToVoiceResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SpeechSynthesisService {

    private static final String DEFAULT_VOICE = "101001";
    private static final String DEFAULT_FORMAT = "mp3";
    private static final String DEFAULT_REGION = "ap-guangzhou";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${tencent.tts.app-id:}")
    private String appId;

    @Value("${tencent.tts.secret-id:}")
    private String secretId;

    @Value("${tencent.tts.secret-key:}")
    private String secretKey;

    @Value("${tencent.tts.secret-token:}")
    private String secretToken;

    @Value("${tencent.tts.region:ap-guangzhou}")
    private String region;

    @Value("${tencent.tts.voice:101001}")
    private String defaultVoice;

    @Value("${tencent.tts.speed:0}")
    private String defaultSpeed;

    @Value("${tencent.tts.volume:30}")
    private String defaultVolume;

    public TtsResult synthesize(String text, String voice, String outputFormat) {
        String cleanText = normalizeText(text);
        if (cleanText.isEmpty()) {
            throw new IllegalArgumentException("文本不能为空");
        }

        String actualAppId = normalizeRequired(appId, "TENCENT_TTS_APP_ID");
        String actualSecretId = normalizeRequired(secretId, "TENCENT_TTS_SECRET_ID");
        String actualSecretKey = normalizeRequired(secretKey, "TENCENT_TTS_SECRET_KEY");
        String actualToken = normalizeOptional(secretToken);
        String actualVoice = normalizeVoice(voice);
        String actualFormat = normalizeFormat(outputFormat);
        Float speed = normalizeSpeed(defaultSpeed);
        Float volume = normalizeVolume(defaultVolume);
        String actualRegion = normalizeRegion(region);

        TtsClient client = buildClient(actualSecretId, actualSecretKey, actualToken, actualRegion);
        if (cleanText.length() <= 150) {
            return synthesizeShortText(client, actualAppId, cleanText, actualVoice, actualFormat, speed, volume);
        }
        return synthesizeLongText(client, actualAppId, cleanText, actualVoice, actualFormat, speed, volume);
    }

    private TtsClient buildClient(String secretId, String secretKey, String token, String region) {
        Credential credential = new Credential(secretId, secretKey);
        if (token != null && !token.trim().isEmpty()) {
            credential.setToken(token.trim());
        }
        HttpProfile httpProfile = new HttpProfile();
        httpProfile.setEndpoint("tts.tencentcloudapi.com");
        ClientProfile clientProfile = new ClientProfile();
        clientProfile.setHttpProfile(httpProfile);
        return new TtsClient(credential, region, clientProfile);
    }

    private TtsResult synthesizeShortText(TtsClient client, String appId, String text, String voice, String format,
                                          Float speed, Float volume) {
        try {
            TextToVoiceRequest request = new TextToVoiceRequest();
            request.setText(text);
            request.setSessionId(UUID.randomUUID().toString());
            request.setVoiceType(Long.parseLong(voice));
            request.setCodec(format);
            request.setProjectId(0L);
            request.setModelType(1L);
            request.setPrimaryLanguage(1L);
            request.setSampleRate(16000L);
            request.setSpeed(speed);
            request.setVolume(volume);

            TextToVoiceResponse response = client.TextToVoice(request);
            String audioBase64 = response.getAudio();
            if (audioBase64 == null || audioBase64.trim().isEmpty()) {
                throw new IllegalStateException("语音合成失败");
            }
            return buildResult(audioBase64.trim(), voice, format);
        } catch (TencentCloudSDKException e) {
            throw new IllegalStateException(formatTencentError(e), e);
        }
    }

    private TtsResult synthesizeLongText(TtsClient client, String appId, String text, String voice, String format,
                                         Float speed, Float volume) {
        try {
            CreateTtsTaskRequest request = new CreateTtsTaskRequest();
            request.setText(text);
            request.setVoiceType(Long.parseLong(voice));
            request.setCodec(format);
            request.setProjectId(0L);
            request.setModelType(1L);
            request.setPrimaryLanguage(1L);
            request.setSampleRate(16000L);
            request.setSpeed(speed);
            request.setVolume(volume);

            CreateTtsTaskResponse response = client.CreateTtsTask(request);
            String taskId = response.getData() == null ? null : response.getData().getTaskId();
            if (taskId == null || taskId.trim().isEmpty()) {
                throw new IllegalStateException("创建语音任务失败");
            }

            String resultUrl = waitForTaskResultUrl(client, taskId.trim());
            if (resultUrl == null || resultUrl.trim().isEmpty()) {
                throw new IllegalStateException("语音任务未返回结果");
            }

            byte[] audioBytes;
            try {
                ResponseEntity<byte[]> audioResponse = restTemplate.getForEntity(resultUrl.trim(), byte[].class);
                audioBytes = audioResponse.getBody();
            } catch (RestClientException e) {
                throw new IllegalStateException("下载语音结果失败: " + e.getMessage(), e);
            }

            if (audioBytes == null || audioBytes.length == 0) {
                throw new IllegalStateException("语音结果为空");
            }

            return buildResult(Base64.getEncoder().encodeToString(audioBytes), voice, format);
        } catch (TencentCloudSDKException e) {
            throw new IllegalStateException(formatTencentError(e), e);
        }
    }

    private String waitForTaskResultUrl(TtsClient client, String taskId) {
        for (int i = 0; i < 12; i++) {
            try {
                DescribeTtsTaskStatusRequest request = new DescribeTtsTaskStatusRequest();
                request.setTaskId(taskId);
                DescribeTtsTaskStatusResponse response = client.DescribeTtsTaskStatus(request);
                if (response.getData() != null && response.getData().getStatus() != null) {
                    Long status = response.getData().getStatus();
                    if (status == 2L) {
                        return response.getData().getResultUrl();
                    }
                    if (status == 3L) {
                        String detail = response.getData().getErrorMsg();
                        throw new IllegalStateException(detail == null || detail.trim().isEmpty() ? "语音任务失败" : detail);
                    }
                }
                TimeUnit.MILLISECONDS.sleep(1000L);
            } catch (TencentCloudSDKException e) {
                throw new IllegalStateException(formatTencentError(e), e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("语音任务等待被中断", e);
            }
        }
        throw new IllegalStateException("语音合成超时");
    }

    private String formatTencentError(TencentCloudSDKException e) {
        String code = e.getErrorCode();
        String message = e.getMessage();
        if (code == null || code.trim().isEmpty()) {
            return "腾讯云语音服务调用失败: " + message;
        }
        if ("AuthFailure.SignatureFailure".equals(code)) {
            return "腾讯云签名校验失败，请检查 SecretId/SecretKey/Token 是否匹配，且是否存在空格、引号或临时密钥过期";
        }
        if ("AuthFailure.SecretIdNotFound".equals(code) || "AuthFailure.InvalidSecretId".equals(code)) {
            return "腾讯云 SecretId 无效，请检查 TENCENT_TTS_SECRET_ID";
        }
        if ("AuthFailure.SecretKeyInvalid".equals(code)) {
            return "腾讯云 SecretKey 无效，请检查 TENCENT_TTS_SECRET_KEY";
        }
        return code + ": " + message;
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

    private Float normalizeSpeed(String speedValue) {
        float speed = parseFloatOrDefault(speedValue, 0f);
        if (speed < -2f) {
            return -2f;
        }
        if (speed > 6f) {
            return 6f;
        }
        return speed;
    }

    private Float normalizeVolume(String volumeValue) {
        float volume = parseFloatOrDefault(volumeValue, 0f);
        if (volume >= -10f && volume <= 10f) {
            return volume;
        }
        float mapped = volume / 5f - 10f;
        if (mapped < -10f) {
            return -10f;
        }
        if (mapped > 10f) {
            return 10f;
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

    private String normalizeRequired(String value, String name) {
        String clean = normalizeOptional(value);
        if (clean == null || clean.isEmpty()) {
            throw new IllegalStateException("未配置腾讯云语音服务，请设置 " + name);
        }
        return clean;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return "";
        }
        String clean = value.trim();
        if ((clean.startsWith("\"") && clean.endsWith("\"")) || (clean.startsWith("'") && clean.endsWith("'"))) {
            clean = clean.substring(1, clean.length() - 1).trim();
        }
        return clean;
    }

    private float parseFloatOrDefault(String value, float defaultValue) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return defaultValue;
            }
            return Float.parseFloat(value.trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
