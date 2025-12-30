package com.galileo.userprofile.controller;

import com.galileo.userprofile.dto.ReadingHistoryDTO;
import com.galileo.userprofile.dto.RecordReadingDTO;
import com.galileo.userprofile.service.ReadingHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReadingHistoryController {
    
    private final ReadingHistoryService readingHistoryService;
    
    /**
     * Récupérer l'historique de lecture d'un utilisateur
     */
    @GetMapping("/{firebaseUid}/history")
    public ResponseEntity<List<ReadingHistoryDTO>> getHistory(@PathVariable String firebaseUid) {
        log.info("Récupération de l'historique pour: {}", firebaseUid);
        List<ReadingHistoryDTO> history = readingHistoryService.getHistory(firebaseUid);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Récupérer l'historique avec pagination
     */
    @GetMapping("/{firebaseUid}/history/paginated")
    public ResponseEntity<Page<ReadingHistoryDTO>> getHistoryPaginated(
            @PathVariable String firebaseUid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Récupération de l'historique paginé pour: {} (page {}, size {})", firebaseUid, page, size);
        Page<ReadingHistoryDTO> history = readingHistoryService.getHistoryPaginated(
                firebaseUid, 
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "readAt")));
        return ResponseEntity.ok(history);
    }
    
    /**
     * Récupérer l'historique récent (par défaut 7 derniers jours)
     */
    @GetMapping("/{firebaseUid}/history/recent")
    public ResponseEntity<List<ReadingHistoryDTO>> getRecentHistory(
            @PathVariable String firebaseUid,
            @RequestParam(defaultValue = "7") int days) {
        log.info("Récupération de l'historique récent pour: {} ({} derniers jours)", firebaseUid, days);
        List<ReadingHistoryDTO> history = readingHistoryService.getRecentHistory(firebaseUid, days);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Enregistrer une lecture
     */
    @PostMapping("/{firebaseUid}/history")
    public ResponseEntity<ReadingHistoryDTO> recordReading(
            @PathVariable String firebaseUid,
            @Valid @RequestBody RecordReadingDTO recordDTO) {
        log.info("Enregistrement de lecture pour {} : publication {}", firebaseUid, recordDTO.getPublicationId());
        ReadingHistoryDTO history = readingHistoryService.recordReading(firebaseUid, recordDTO);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Mettre à jour la progression de lecture
     */
    @PatchMapping("/{firebaseUid}/history/{publicationId}/progress")
    public ResponseEntity<ReadingHistoryDTO> updateProgress(
            @PathVariable String firebaseUid,
            @PathVariable Long publicationId,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestParam(required = false) Integer progressPercentage) {
        log.info("Mise à jour progression pour {} : publication {} ({}%, {} sec)", 
                firebaseUid, publicationId, progressPercentage, durationSeconds);
        ReadingHistoryDTO history = readingHistoryService.updateProgress(
                firebaseUid, publicationId, durationSeconds, progressPercentage);
        return ResponseEntity.ok(history);
    }
}

