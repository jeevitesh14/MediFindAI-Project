package com.medifindai.controller;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;
import com.medifindai.dto.common.ApiResponse;
import com.medifindai.service.AiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        AiChatResponse response = aiAssistantService.generateReply(request);
        return ApiResponse.success(response);
    }
}
