package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 首页控制器
 */
@RestController
public class IndexController {

  /**
   * 健康检查与首页
   */
  @GetMapping("/")
  public ApiResponse<String> index() {
    return ApiResponse.success("听雨眠舟服务启动成功");
  }

  @GetMapping("/api/health")
  public ApiResponse<String> health() {
    return ApiResponse.success("ok");
  }

}
