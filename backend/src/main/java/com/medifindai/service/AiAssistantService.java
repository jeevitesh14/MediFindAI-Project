package com.medifindai.service;

import com.medifindai.dto.ai.AiChatRequest;
import com.medifindai.dto.ai.AiChatResponse;

public interface AiAssistantService {
    AiChatResponse generateReply(AiChatRequest request);
}
