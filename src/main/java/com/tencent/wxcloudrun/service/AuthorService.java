package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.AuthorMapper;
import com.tencent.wxcloudrun.model.Author;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthorService {

    @Autowired
    private AuthorMapper authorMapper;

    public Author getAuthorByName(String name) {
        return authorMapper.findByName(name);
    }

    public Author getAuthorById(String id) {
        return authorMapper.findById(id);
    }
}
