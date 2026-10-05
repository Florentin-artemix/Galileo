package com.galileo.notifications.repository;

import com.galileo.auth.entity.User;
import com.galileo.notifications.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByUser(User user);
    Optional<NotificationPreference> findByUserId(Long userId);
}
