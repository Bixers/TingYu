package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.TagMapper;
import com.tencent.wxcloudrun.model.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TagService {

    @Autowired
    private TagMapper tagMapper;

    public List<Tag> getAllTags() {
        return tagMapper.findAll();
    }

    public Map<String, List<Tag>> getTagsGrouped() {
        List<Tag> allTags = tagMapper.findAll();
        return allTags.stream().collect(
            Collectors.groupingBy(
                tag -> tag.getCategory() != null ? tag.getCategory() : "其他",
                LinkedHashMap::new,
                Collectors.toList()
            )
        );
    }
}
