package com.galileo.lecture.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.lecture.dto.EventCreateDTO;
import com.galileo.lecture.dto.EventDTO;
import com.galileo.lecture.entity.Event;
import com.galileo.lecture.repository.EventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Récupérer tous les événements avec pagination
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getAllEvents(Pageable pageable) {
        Page<Event> events = eventRepository.findAllByOrderByDateDesc(pageable);
        List<EventDTO> dtos = events.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, events.getTotalElements());
    }

    /**
     * Récupérer tous les événements (sans pagination)
     */
    @Transactional(readOnly = true)
    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllByOrderByDateDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un événement par ID
     */
    @Transactional(readOnly = true)
    public EventDTO getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé: " + id));
        return convertToDTO(event);
    }

    /**
     * Récupérer les événements à venir
     */
    @Transactional(readOnly = true)
    public List<EventDTO> getUpcomingEvents() {
        return eventRepository.findByDateGreaterThanEqualOrderByDateAsc(LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les événements passés
     */
    @Transactional(readOnly = true)
    public List<EventDTO> getPastEvents() {
        return eventRepository.findByDateLessThanOrderByDateDesc(LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Créer un nouvel événement
     */
    public EventDTO createEvent(EventCreateDTO dto) {
        Event event = convertToEntity(dto);
        Event saved = eventRepository.save(event);
        log.info("Événement créé: {} (ID: {})", saved.getTitleFr(), saved.getId());
        return convertToDTO(saved);
    }

    /**
     * Mettre à jour un événement
     */
    public EventDTO updateEvent(Long id, EventCreateDTO dto) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé: " + id));
        
        updateEntityFromDTO(event, dto);
        Event saved = eventRepository.save(event);
        log.info("Événement mis à jour: {} (ID: {})", saved.getTitleFr(), saved.getId());
        return convertToDTO(saved);
    }

    /**
     * Supprimer un événement
     */
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Événement non trouvé: " + id);
        }
        eventRepository.deleteById(id);
        log.info("Événement supprimé: ID {}", id);
    }

    /**
     * Rechercher des événements
     */
    @Transactional(readOnly = true)
    public List<EventDTO> searchEvents(String query) {
        return eventRepository.searchEvents(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les événements par domaine
     */
    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByDomain(String domain) {
        return eventRepository.findByDomain(domain).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les événements par type
     */
    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByType(String type) {
        return eventRepository.findByType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============ Méthodes de conversion ============

    private EventDTO convertToDTO(Event event) {
        EventDTO dto = new EventDTO();
        dto.setId(event.getId());
        
        // Titre
        Map<String, String> title = new HashMap<>();
        title.put("fr", event.getTitleFr());
        title.put("en", event.getTitleEn());
        dto.setTitle(title);
        
        // Date
        dto.setDate(event.getDate().toString());
        
        // Type
        Map<String, String> type = new HashMap<>();
        type.put("fr", event.getTypeFr());
        type.put("en", event.getTypeEn());
        dto.setType(type);
        
        // Domaine
        Map<String, String> domain = new HashMap<>();
        domain.put("fr", event.getDomainFr());
        domain.put("en", event.getDomainEn());
        dto.setDomain(domain);
        
        dto.setLocation(event.getLocation());
        
        // Résumé
        Map<String, String> summary = new HashMap<>();
        summary.put("fr", event.getSummaryFr());
        summary.put("en", event.getSummaryEn());
        dto.setSummary(summary);
        
        // Description
        Map<String, String> description = new HashMap<>();
        description.put("fr", event.getDescriptionFr());
        description.put("en", event.getDescriptionEn());
        dto.setDescription(description);
        
        dto.setImageUrl(event.getImageUrl());
        
        // Tags (JSON -> List)
        dto.setTags(parseJsonToList(event.getTags()));
        
        // Photos (JSON -> List)
        dto.setPhotos(parseJsonToList(event.getPhotos()));
        
        // Speakers (JSON -> List)
        dto.setSpeakers(parseJsonToSpeakers(event.getSpeakers()));
        
        // Resources (JSON -> List)
        dto.setResources(parseJsonToResources(event.getResources()));
        
        return dto;
    }

    private Event convertToEntity(EventCreateDTO dto) {
        Event event = new Event();
        updateEntityFromDTO(event, dto);
        return event;
    }

    private void updateEntityFromDTO(Event event, EventCreateDTO dto) {
        if (dto.getTitle() != null) {
            event.setTitleFr(dto.getTitle().getOrDefault("fr", ""));
            event.setTitleEn(dto.getTitle().getOrDefault("en", ""));
        }
        
        if (dto.getDate() != null) {
            event.setDate(LocalDate.parse(dto.getDate()));
        }
        
        if (dto.getType() != null) {
            event.setTypeFr(dto.getType().getOrDefault("fr", ""));
            event.setTypeEn(dto.getType().getOrDefault("en", ""));
        }
        
        if (dto.getDomain() != null) {
            event.setDomainFr(dto.getDomain().getOrDefault("fr", ""));
            event.setDomainEn(dto.getDomain().getOrDefault("en", ""));
        }
        
        event.setLocation(dto.getLocation());
        
        if (dto.getSummary() != null) {
            event.setSummaryFr(dto.getSummary().getOrDefault("fr", ""));
            event.setSummaryEn(dto.getSummary().getOrDefault("en", ""));
        }
        
        if (dto.getDescription() != null) {
            event.setDescriptionFr(dto.getDescription().getOrDefault("fr", ""));
            event.setDescriptionEn(dto.getDescription().getOrDefault("en", ""));
        }
        
        event.setImageUrl(dto.getImageUrl());
        
        // Tags -> JSON
        event.setTags(listToJson(dto.getTags()));
        
        // Photos -> JSON
        event.setPhotos(listToJson(dto.getPhotos()));
        
        // Speakers -> JSON
        event.setSpeakers(objectToJson(dto.getSpeakers()));
        
        // Resources -> JSON
        event.setResources(objectToJson(dto.getResources()));
    }

    private List<String> parseJsonToList(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Erreur parsing JSON list: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<EventDTO.SpeakerDTO> parseJsonToSpeakers(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<EventDTO.SpeakerDTO>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Erreur parsing speakers JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<EventDTO.ResourceDTO> parseJsonToResources(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<EventDTO.ResourceDTO>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Erreur parsing resources JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private String listToJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.warn("Erreur conversion list to JSON: {}", e.getMessage());
            return "[]";
        }
    }

    private String objectToJson(Object obj) {
        if (obj == null) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Erreur conversion object to JSON: {}", e.getMessage());
            return "[]";
        }
    }
}
