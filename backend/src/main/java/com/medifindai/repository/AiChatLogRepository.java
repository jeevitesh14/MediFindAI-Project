package com.medifindai.repository;

import com.medifindai.entity.AiChatLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiChatLogRepository extends JpaRepository<AiChatLog, Long> {
    List<AiChatLog> findBySessionIdOrderByCreatedAtAsc(String sessionId);
}
