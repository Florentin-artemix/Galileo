package com.galileo.notifications.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.notifications.entity.Notification;
import com.galileo.notifications.entity.NotificationPreference;
import com.galileo.notifications.repository.NotificationPreferenceRepository;
import com.galileo.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(targetId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @GetMapping("/{userId}/paginated")
    public ResponseEntity<Page<Map<String, Object>>> getNotificationsPaginated(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Notification> notifPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(targetId, pageable);
        return ResponseEntity.ok(notifPage.map(this::toMap));
    }

    @GetMapping("/{userId}/unread")
    public ResponseEntity<List<Map<String, Object>>> getUnreadNotifications(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        List<Notification> list = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(targetId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @GetMapping("/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        long total = notificationRepository.countByUserId(targetId);
        long unread = notificationRepository.countByUserIdAndIsReadFalse(targetId);

        return ResponseEntity.ok(Map.of(
                "total", total,
                "unread", unread,
                "byType", Collections.emptyMap()
        ));
    }

    @PatchMapping("/{userId}/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String userId,
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        Notification notif = notificationRepository.findById(id).orElse(null);
        if (notif != null && notif.getUser().getId().equals(targetId)) {
            notif.setIsRead(true);
            notif.setReadAt(LocalDateTime.now());
            notificationRepository.save(notif);
            return ResponseEntity.ok(toMap(notif));
        }
        return ResponseEntity.ok(Collections.emptyMap());
    }

    @PatchMapping("/{userId}/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(targetId);
        unread.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(ApiResponse.ok("Toutes les notifications sont marquées comme lues"));
    }

    @DeleteMapping("/{userId}/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String userId,
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(targetId)) {
                notificationRepository.delete(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Notification supprimée"));
    }

    @GetMapping("/{userId}/preferences")
    public ResponseEntity<Map<String, Object>> getPreferences(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long targetId = resolveUserId(userId, userDetails);
        NotificationPreference pref = preferenceRepository.findByUserId(targetId).orElse(null);
        Map<String, Object> map = new HashMap<>();
        map.put("userId", String.valueOf(targetId));
        map.put("emailEnabled", true);
        map.put("pushEnabled", true);
        map.put("submission", pref == null || Boolean.TRUE.equals(pref.getSubmission()));
        map.put("validation", pref == null || Boolean.TRUE.equals(pref.getValidation()));
        map.put("publication", pref == null || Boolean.TRUE.equals(pref.getPublication()));
        map.put("mutedTypes", Collections.emptyList());
        return ResponseEntity.ok(map);
    }

    @PutMapping("/{userId}/preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @PathVariable String userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return getPreferences(userId, userDetails);
    }

    private Long resolveUserId(String userIdStr, CustomUserDetails userDetails) {
        if ("me".equalsIgnoreCase(userIdStr) || userDetails.getId().toString().equals(userIdStr)) {
            return userDetails.getId();
        }
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return userDetails.getId();
        }
    }

    private Map<String, Object> toMap(Notification n) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(n.getId()));
        map.put("userId", String.valueOf(n.getUser().getId()));
        map.put("type", n.getType() != null ? n.getType().name() : "SYSTEM_ANNOUNCEMENT");
        map.put("title", n.getTitle());
        map.put("message", n.getMessage());
        map.put("read", Boolean.TRUE.equals(n.getIsRead()));
        map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        map.put("readAt", n.getReadAt() != null ? n.getReadAt().toString() : null);
        return map;
    }
}
