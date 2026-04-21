package com.tencent.wxcloudrun.dto;

import com.tencent.wxcloudrun.model.BoatMessage;
import lombok.Data;

import java.util.List;

@Data
public class BoatThreadResult {

    private BoatMessage root;
    private List<BoatMessage> replies;
}

