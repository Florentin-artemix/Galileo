package com.galileo.content.repository;

import com.galileo.content.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findByIsPublishedTrueOrderByEventDateAsc(Pageable pageable);
    List<Event> findByIsPublishedTrueAndEventDateAfterOrderByEventDateAsc(LocalDateTime date);
}
