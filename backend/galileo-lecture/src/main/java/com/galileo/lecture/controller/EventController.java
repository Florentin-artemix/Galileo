package com.galileo.lecture.controller;

import com.galileo.lecture.dto.EventCreateDTO;
import com.galileo.lecture.dto.EventDTO;
import com.galileo.lecture.service.EventService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les événements
 */
@Slf4j
@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /**
     * GET /events - Lister tous les événements avec pagination
     */
    @GetMapping
    public ResponseEntity<Page<EventDTO>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Récupération des événements - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<EventDTO> events = eventService.getAllEvents(pageable);
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/all - Lister tous les événements sans pagination
     */
    @GetMapping("/all")
    public ResponseEntity<List<EventDTO>> getAllEventsNoPagination() {
        log.info("Récupération de tous les événements");
        List<EventDTO> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/{id} - Récupérer un événement par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        log.info("Récupération de l'événement ID: {}", id);
        try {
            EventDTO event = eventService.getEventById(id);
            return ResponseEntity.ok(event);
        } catch (RuntimeException e) {
            log.warn("Événement non trouvé: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /events/upcoming - Événements à venir
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<EventDTO>> getUpcomingEvents() {
        log.info("Récupération des événements à venir");
        List<EventDTO> events = eventService.getUpcomingEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/past - Événements passés
     */
    @GetMapping("/past")
    public ResponseEntity<List<EventDTO>> getPastEvents() {
        log.info("Récupération des événements passés");
        List<EventDTO> events = eventService.getPastEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/search?q=... - Rechercher des événements
     */
    @GetMapping("/search")
    public ResponseEntity<List<EventDTO>> searchEvents(@RequestParam String q) {
        log.info("Recherche d'événements: {}", q);
        List<EventDTO> events = eventService.searchEvents(q);
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/domain/{domain} - Événements par domaine
     */
    @GetMapping("/domain/{domain}")
    public ResponseEntity<List<EventDTO>> getEventsByDomain(@PathVariable String domain) {
        log.info("Récupération des événements par domaine: {}", domain);
        List<EventDTO> events = eventService.getEventsByDomain(domain);
        return ResponseEntity.ok(events);
    }

    /**
     * GET /events/type/{type} - Événements par type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<EventDTO>> getEventsByType(@PathVariable String type) {
        log.info("Récupération des événements par type: {}", type);
        List<EventDTO> events = eventService.getEventsByType(type);
        return ResponseEntity.ok(events);
    }

    /**
     * POST /events - Créer un nouvel événement
     */
    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventCreateDTO dto) {
        log.info("Création d'un nouvel événement: {}", dto.getTitle());
        EventDTO created = eventService.createEvent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /events/{id} - Mettre à jour un événement
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventCreateDTO dto) {
        log.info("Mise à jour de l'événement ID: {}", id);
        try {
            EventDTO updated = eventService.updateEvent(id, dto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Erreur mise à jour événement {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de mise à jour",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /events/{id} - Supprimer un événement
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        log.info("Suppression de l'événement ID: {}", id);
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erreur suppression événement {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur de suppression",
                    "message", e.getMessage()
            ));
        }
    }
}
