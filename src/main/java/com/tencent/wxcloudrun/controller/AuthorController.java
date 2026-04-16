package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.model.Author;
import com.tencent.wxcloudrun.service.AuthorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/authors")
@CrossOrigin(origins = "*")
public class AuthorController {

    @Autowired
    private AuthorService authorService;

    @GetMapping("/by-name")
    public ApiResponse<Author> getAuthorByName(@RequestParam String name) {
        try {
            Author author = authorService.getAuthorByName(name);
            if (author != null) {
                return ApiResponse.success(author);
            }
            return ApiResponse.notFound("未找到作者信息");
        } catch (Exception e) {
            return ApiResponse.error("获取作者信息失败：" + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Author> getAuthorById(@PathVariable String id) {
        try {
            Author author = authorService.getAuthorById(id);
            if (author != null) {
                return ApiResponse.success(author);
            }
            return ApiResponse.notFound("未找到作者信息");
        } catch (Exception e) {
            return ApiResponse.error("获取作者信息失败：" + e.getMessage());
        }
    }
}
